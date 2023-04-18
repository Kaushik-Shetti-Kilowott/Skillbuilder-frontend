import React, { useMemo, useState, useEffect, useCallback } from "react";
import DataTable from "@ui-library/DataTable";
import InfoPopup from "@ui-library/InfoPopup";
import styled from "styled-components";
import SerialNumber from "@ui-library/SerialNumber";
import Dropdown, { Options } from "@ui-library/Dropdown";
import AddNewQuestion from "./AddNewQuestion";
import Answers from "./Answers";
import QuestionComponent from "@ui-library/QuestionComponent";
import transformAnswerForSaving from "@transformers/answerForSaving.transformer";
import {
  getImportanceLabel,
  getConfidenceLabel,
  getDifferentiationLabel,
} from "@utils/helpers";
import questionFiltersToAnswerFiltersTransformer from "@transformers/questionFiltersToAnswerFilters.transformer";
import { getInfoText } from "@utils/helpers";
import SliderDropdown from "@ui-library/SliderDropdown";
import { useMutation } from "react-query";
import questionService from "@services/question.service";
import { useTeam } from "@contexts/TeamContext";
import { Rules as PriorityRiskRules } from "@ui-library/Priority";
import { useAuthUser } from "@contexts/AuthContext";
import Bus from "@utils/Bus";
import answerService from "@services/answer.service";

export default function DetailViewTable({
  data,
  searchKeyword,
  isDetailView,
  filters,
  refetchData,
  refetchFavourites,
  showOptions,
}) {
  const [tableData, setTableData] = useState(data);
  const [skipPageReset, setSkipPageReset] = React.useState(false);
  const { team } = useTeam();
  const { auth } = useAuthUser();
  useEffect(() => {
    setSkipPageReset(false);
  }, [tableData]);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const updateData = useCallback((rowIndex, columnId, value) => {
    setSkipPageReset(true);
    setTableData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          };
        }
        return row;
      })
    );
  }, []);

  const memoSearchKeyword = useMemo(() => searchKeyword, [searchKeyword]);

  const mutation = useMutation(
    ({ teamId, data }) => questionService.update(teamId, data),
    {
      onSuccess: (res) => {
        // refetchData && refetchData();
      },
      onError: (error) => {
        Bus.emit("error", { operation: "open", error: error.response });
      },
    }
  );

  const answerMutation = useMutation(({ teamId, answerId, data }) =>
    answerService.update(teamId, answerId, data)
  );

  const submitUpdate = (id, questionText, frequency, importance) => {
    mutation.mutateAsync({
      teamId: team.id,
      data: {
        questions: [
          {
            questionId: id,
            questionText: questionText,
            frequency: frequency,
            importance: Number(importance),
            priority: PriorityRiskRules.Q[frequency][importance].label,
          },
        ],
      },
    });
  };

  const submitAnswerUpdate = (values) => {
    answerMutation.mutateAsync({
      teamId: team.id,
      answerId: values?.answerId,
      data: transformAnswerForSaving(values),
    });
  };

  const tableHeader = useMemo(
    () => [
      {
        accessor: "number",
        Header: "#",
        Cell: ({ value, row: { original } }) => (
          <SerialNumber
            value={value}
            showOptions={showOptions}
            question={original}
            filters={filters}
            refetchData={refetchData}
            refetchFavourites={refetchFavourites}
            mergeId={original.mergeId}
          />
        ),

        Footer: () => (
          <AddNewQuestion
            refetchFavourites={refetchFavourites}
            refetchData={refetchData}
          />
        ),
      },
      {
        accessor: "questionText",
        Header: (
          <THContentWrapper>
            Questions{" "}
            <InfoPopup title="Questions" text={getInfoText("question")} />
          </THContentWrapper>
        ),
        Cell: ({ row: { original }, value }) => (
          <QuestionComponent
            id={original.id}
            labels={original.labels}
            frequency={original.frequency}
            importance={original.importance}
            author={original.author}
            createdAt={original.createdAt}
            value={value}
            clickable={false}
            showFactors={!isDetailView}
            searchKeyword={searchKeyword}
            filters={filters}
            refetchData={refetchData}
            mergeId={original.mergeId}
            watchCount={original.watchCount}
          />
        ),
      },
      {
        accessor: "frequency",
        Header: (
          <THContentWrapper className="align-items-center">
            Frequency{" "}
            <InfoPopup title="Frequency" text={getInfoText("frequency")} />
          </THContentWrapper>
        ),
        Cell: ({ row: { original, index }, column: { id } }) => (
          <Dropdown
            placeholder="Select One"
            name="frequency"
            value={original.frequency}
            options={Options.Frequency}
            disabled={auth?.user?.id === original.author.id ? false : true}
            onSelect={({ frequency }) => {
              updateData(index, id, frequency);
              submitUpdate(
                original.id,
                original.questionText,
                frequency,
                Number(original.importance)
              );
            }}
          />
        ),
      },
      {
        accessor: "importance",
        Header: (
          <THContentWrapper className="align-items-center">
            Importance{" "}
            <InfoPopup title="Importance" text={getInfoText("importance")} />
          </THContentWrapper>
        ),
        Cell: ({ row: { original, index }, column: { id } }) => (
          <SliderDropdown
            type="Importance"
            value={original.importance}
            label={getImportanceLabel(original.importance)}
            readOnly={auth?.user?.id === original.author.id ? false : true}
            setValue={(importance) => {
              updateData(index, id, importance);
              submitUpdate(
                original.id,
                original.questionText,
                original.frequency,
                Number(importance)
              );
            }}
          />
        ),
      },
      {
        accessor: "answer",
        Header: (
          <THContentWrapper>
            Answers <InfoPopup title="Answers" text={getInfoText("answer")} />
          </THContentWrapper>
        ),
        Cell: ({ row: { original, index } }) => (
          <Answers
            index={index}
            question={original}
            updateData={updateData}
            isDetailView={isDetailView}
            searchKeyword={memoSearchKeyword}
            filters={questionFiltersToAnswerFiltersTransformer(filters)}
            refetchData={refetchData}
          />
        ),
      },
      {
        accessor: "confidence",
        Header: (
          <THContentWrapper className="align-items-center">
            Confidence{" "}
            <InfoPopup title="Confidence" text={getInfoText("confidence")} />
          </THContentWrapper>
        ),
        Cell: ({ row: { original, index }, column: { id } }) => (
          <>
            {original.confidence && (
              <SliderDropdown
                type="Confidence"
                value={original.confidence}
                label={getConfidenceLabel(original.confidence)}
                readOnly={auth?.user?.id === original.author.id ? false : true}
                setValue={(confidence) => {
                  updateData(index, id, confidence);
                  submitAnswerUpdate({
                    answerId: original.answerId,
                    answer: original.answer,
                    confidence: Number(confidence),
                    differentiation: original.differentiation,
                    attachment: original.answerAttachment,
                  });
                }}
              />
            )}
          </>
        ),
      },
      {
        accessor: "differentiation",
        Header: (
          <THContentWrapper
            className="align-items-center"
            style={{ width: 120 }}
          >
            Differentiation{" "}
            <InfoPopup
              title="Differentiation"
              text={getInfoText("differentiation")}
            />
          </THContentWrapper>
        ),
        Cell: ({ row: { original, index }, column: { id } }) => (
          <>
            {original.differentiation && (
              <SliderDropdown
                type="Differentiation"
                value={original.differentiation}
                label={getDifferentiationLabel(original.differentiation)}
                readOnly={auth?.user?.id === original.author.id ? false : true}
                setValue={(differentiation) => {
                  updateData(index, id, differentiation);
                  submitAnswerUpdate({
                    answerId: original.answerId,
                    answer: original.answer,
                    confidence: original.confidence,
                    differentiation: Number(differentiation),
                    attachment: original.answerAttachment,
                  });
                }}
              />
            )}
          </>
        ),
      },
      {
        accessor: "qLabels",
        Header: (
          <THContentWrapper
            className="align-items-center"
            style={{ width: 120 }}
          >
            <Text>Question Labels</Text>
          </THContentWrapper>
        ),
        Cell: ({ value }) => <Text>{value}</Text>,
      },
      {
        accessor: "aLabels",
        Header: (
          <THContentWrapper
            className="align-items-center"
            style={{ width: 120 }}
          >
            <Text>Answer Labels</Text>
          </THContentWrapper>
        ),
        Cell: ({ value }) => <Text>{value}</Text>,
      },
    ],
    [isDetailView, searchKeyword, data]
  );

  return (
    <TableWrapper isDetailView={isDetailView}>
      <DataTable
        data={tableData}
        header={
          isDetailView
            ? tableHeader
            : tableHeader.filter((header) =>
                header.accessor.match(/number|questionText|answer/)
              )
        }
        enableFooter
        isSortable
        // enableGlobalSearchFilter
        // searchKeyword={searchKeyword}
        skipPageReset={skipPageReset}
      />
    </TableWrapper>
  );
}

const TableWrapper = styled.div`
  .th-container {
    display: flex;
  }
  table {
    th {
      &:nth-child(5) {
        min-width: 250px;
      }
      &:nth-child(8),
      &:nth-child(9) {
        display: none;
      }
    }

    tbody tr {
      &,
      td {
        height: 100%;
      }

      td {
        padding: 0.8rem;
      }

      ${(props) =>
        props.isDetailView &&
        `
        td:nth-child(3), 
        td:nth-child(4), 
        td:nth-child(6), 
        td:nth-child(7){
          vertical-align: middle;
          max-width: 138px;
        }
        td:nth-child(8),
        td:nth-child(9) {
          display: none;
        }
      `}
    }
  }
`;

const THContentWrapper = styled.span`
  display: flex;
  align-items: center;
`;

const Text = styled.div`
  font-family: "Barlow Condensed", sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 20px;
  text-align: center;
  color: #1f5462;
`;
