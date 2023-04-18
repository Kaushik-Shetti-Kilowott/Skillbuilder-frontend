import React, { useState, useMemo } from "react";
import styled from "styled-components";
import add from "@public/svgs/add.svg";
import Image from "next/image";
import { useTeam } from "@contexts/TeamContext";
import labelService from "@services/label.service";
import { useMutation, useQueryClient } from "react-query";
import { InputGroup } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import Tooltip from "@ui-library/Tooltip";
import { IoIosClose } from "react-icons/io";
import Highlighter from "react-highlight-words";

export default function Labels({
  questionId,
  answerId,
  labels = [], // labels array for the question or answer
  filters,
  searchKeyword,
  showAddLabel = true,
  refetchSummaryView,
}) {
  const queryClient = useQueryClient();
  const { team } = useTeam();
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");
  const id = answerId || questionId;
  const type = useMemo(() => (answerId ? "answer" : "question"), []);
  const [deleteLabel, setdeleteLabel] = useState("");

  const mutationDelete = useMutation(
    ({ id, teamId, label }) => labelService.delete({ id, teamId, label, type }),
    {
      onMutate: ({ label }) => {
        if (type === "question") {
          queryClient.setQueryData(
            [
              "questionnaire-infinite",
              { teamId: team?.id, filters, searchString: searchKeyword },
            ],

            (old) => {
              if (old) {
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    data: page.data.map((_q) =>
                      _q.id === questionId
                        ? {
                            ..._q,
                            labels: [
                              ...labels.filter((item) => item !== label),
                            ],
                          }
                        : _q
                    ),
                  })),
                };
              }
              return old;
            }
          );

          queryClient.setQueriesData(
            ["question", { teamId: team?.id, questionId }],

            (old) => {
              if (old) {
                return {
                  ...old,
                  data: {
                    ...old.data,
                    labels: [...labels.filter((item) => item !== label)],
                  },
                };
              }
              return old;
            }
          );
        } else if (type === "answer") {
          // queryClient.setQueryData(
          //   [
          //     "answers",
          //     {
          //       teamId: team?.id,
          //       questionId: question.id,
          //       filters,
          //       answerType: "details",
          //       searchString: searchKeyword,
          //     },
          //   ],
          //   (old) => {
          //     if (old) {
          //       return {
          //         ...old,
          //         pages: old.pages.map((page) => ({
          //           ...page,
          //           data: page.data.map((_q) =>
          //             _q.id === answerId
          //               ? {
          //                   ..._q,
          //                   labels: [
          //                     ...labels.filter((item) => item !== label),
          //                   ],
          //                 }
          //               : _q
          //           ),
          //         })),
          //       };
          //     }
          //     return old;
          //   }
          // );

          queryClient.setQueryData(
            [
              "all-answers",
              {
                teamId: team?.id,
                questionId,
                filters,
                answerType: "card",
                type: "all",
              },
            ],

            (old) => {
              if (old) {
                return {
                  ...old,
                  data: old.data.map((_a) =>
                    _a.id === answerId
                      ? {
                          ..._a,
                          labels: [...labels.filter((item) => item !== label)],
                        }
                      : _a
                  ),
                };
              }
              return old;
            }
          );
        }
      },
      onSuccess: () => {
        refetchSummaryView && refetchSummaryView();
      },
    }
  );

  const mutation = useMutation(
    ({ id, teamId, text }) => labelService.create({ id, teamId, text, type }),
    {
      onMutate: ({ text }) => {
        setShowInput(false);
        setText("");

        if (type === "answer") {
          // queryClient.setQueryData(
          //   [
          //     "answers",
          //     {
          //       teamId: team?.id,
          //       questionId: question.id,
          //       filters,
          //       answerType: "details",
          //       searchString: searchKeyword,
          //     },
          //   ],
          //   (old) => {
          //     if (old) {
          //       return {
          //         ...old,
          //         pages: old.pages.map((page) => ({
          //           ...page,
          //           data: page.data.map((_a) =>
          //             _a.id === answerId
          //               ? { ..._a, labels: [..._a.labels, text] }
          //               : _a
          //           ),
          //         })),
          //       };
          //     }
          //   }
          // );

          queryClient.setQueryData(
            [
              "all-answers",
              {
                teamId: team?.id,
                questionId,
                filters,
                answerType: "card",
                type: "all",
              },
            ],
            (old) => {
              if (old) {
                return {
                  ...old,
                  data: old.data.map((_a) =>
                    _a.id === answerId
                      ? { ..._a, labels: [..._a.labels, text] }
                      : _a
                  ),
                };
              }
              return old;
            }
          );
        } else if (type === "question") {
          queryClient.setQueryData(
            [
              "questionnaire-infinite",
              { teamId: team?.id, filters, searchString: searchKeyword },
            ],
            (old) => {
              if (old) {
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    data: page.data.map((_q) =>
                      _q.id === questionId
                        ? { ..._q, labels: [..._q.labels, text] }
                        : _q
                    ),
                  })),
                };
              }
              return old;
            }
          );

          queryClient.setQueriesData(
            ["question", { teamId: team?.id, questionId }],
            (old) => {
              if (old) {
                return {
                  ...old,
                  data: {
                    ...old.data,
                    labels: [...old.data.labels, text],
                  },
                };
              }
              return old;
            }
          );
        }
      },
      onSuccess: () => {
        refetchSummaryView && refetchSummaryView();
      },
    }
  );

  const addLabel = () => {
    if (text.trim()) {
      let _labels = labels.map((label) => label.toLowerCase());
      if (_labels.includes(text.toLowerCase())) {
        setShowInput(false);
        setText("");
        return;
      }
      mutation.mutate({ teamId: team.id, id, text });
    }
  };

  return (
    <Wrapper className="labelsWrap">
      {labels &&
        labels.map((label, idx) => (
          <span key={idx}>
            <Label>
              {showAddLabel && (
                <Tooltip text="Delete Label">
                  <span>
                    <IoIosClose
                      size={18}
                      className="close-icon"
                      color="red"
                      onClick={() => {
                        setdeleteLabel(label);
                        mutationDelete.mutate({
                          teamId: team.id,
                          id,
                          label,
                        });
                      }}
                    />
                  </span>
                </Tooltip>
              )}
              <Highlighter
                highlightClassName="highlight"
                searchWords={[searchKeyword]}
                autoEscape={true}
                textToHighlight={label}
              />
            </Label>
          </span>
        ))}
      {showAddLabel && (
        <InputGroup className={`mt-1 d-${showInput ? "block" : "inline"}`}>
          {showInput && (
            <Input
              placeholder="Type Label Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={50}
              required
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addLabel();
                }
              }}
            />
          )}

          <Tooltip text="Add Label">
            <Button
              key={"add_label_" + id}
              onClick={(e) => {
                if (!showInput) setShowInput(true);
                else addLabel();
              }}
            >
              <Image src={add} alt="add" />
            </Button>
          </Tooltip>

          {showInput && (
            <Tooltip text="Cancel">
              <Button
                onClick={() => {
                  setShowInput(false);
                  setText("");
                }}
              >
                <FaTimes color="#C10840" size={12} />
              </Button>
            </Tooltip>
          )}
        </InputGroup>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div``;

const Input = styled.input`
  &&& {
    border: none;
    background: #e0f4f488;
    border-radius: 5px;
    padding: 3px 6px;
    display: inline-block;
    margin-right: 4px;
    font-family: Manrope, sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 16px;
    color: #1f5462;
    min-width: 100px;
  }
`;

const Label = styled.span`
  background: #e0f4f488;
  border-radius: 5px;
  padding: 3px 6px;
  display: inline-block;
  margin-right: 4px;
  font-family: Manrope, sans-serif;
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  color: #1f5462;

  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  vertical-align: bottom;
  margin-bottom: 5px;

  .close-icon {
    visibility: hidden;
  }

  &:hover {
    .close-icon {
      visibility: visible;

      cursor: pointer;
      transition: 0.5s ease;
    }
  }
`;

const Button = styled.button`
  &&& {
    border: none;
    background: #e0f4f488;
    border-radius: 5px;
    padding: 3px 6px;
    display: inline-block;
    margin-right: 4px;
    font-family: Manrope, sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    color: #1f5462;
    margin-bottom: 5px;
  }
`;
