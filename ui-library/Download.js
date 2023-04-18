import React from 'react';
import styled from 'styled-components';
import Image from "next/image";
import csv from '@public/svgs/csv.svg';
import {CSVLink} from "react-csv";

const Text = styled.span`
  font-family: Manrope,sans-serif;
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 19px;
  color: #393D3E;
  margin-left: 11px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Download = (props) => {
  const {data, filename, ...rest} = props;
  return <CSVLink data={data} filename={filename}>
    <Row {...rest}>
      <Image src={csv} alt='csv' />
      <Text>Download your work as a CSV file </Text>
    </Row>
  </CSVLink>;
};

export default Download;
