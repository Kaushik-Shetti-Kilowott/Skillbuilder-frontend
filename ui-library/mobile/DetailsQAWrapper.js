import React, { useCallback, useEffect, useMemo, useState } from "react";
import DetailsQA from "@ui-library/mobile/DetailsQA";
import AddNewQuestion from "@components/dataTables/DetailViewTable/AddNewQuestion";
import { Divider } from "@ui-library/mobile/Divider";

const SortFuncs = {
  ["Question No"]: (a, b) => a.number - b.number,
  Questions: (a, b) => a.questionText.localeCompare(b.questionText),
  Frequency: (a, b) => a.frequency.localeCompare(b.frequency),
  Importance: (a, b) => a.importance - b.importance,
};

export default function DetailsQAWrapper({
  data,
  searchKeyword,
  filters,
  sort,
  isDetailView,
}) {
  const [questions, setQuestions] = useState(data);

  useEffect(() => setQuestions(data), [data]);

  const updateData = useCallback((rowIndex, columnId, value) => {
    setQuestions((old) =>
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

  const length = questions.length;

  return (
    <>
      {questions.sort(SortFuncs[sort]).map((question, index) => (
        <DetailsQA
          index={index}
          key={question.questionId}
          question={question}
          filters={filters}
          searchKeyword={memoSearchKeyword}
          updateData={updateData}
          lastItem={length - 1 === index}
          isDetailView={isDetailView}
        />
      ))}
      <Divider />
      <AddNewQuestion />
    </>
  );
}
