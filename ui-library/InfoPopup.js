import React from 'react';
import styled from 'styled-components';
import { 
  OverlayTrigger, 
  Popover as BsPopover, 
  Button as BsButton,
} from 'react-bootstrap';
import { IoIosInformationCircleOutline } from 'react-icons/io'

export default function InfoPopup({ 
  title = 'Title',
  text = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Molestiae facilis, repudiandae.'
}) {
  return (
    <OverlayTrigger
      // trigger="click"
      placement='top'
      overlay={
        <Popover>
          <Popover.Header as="h3">{title}</Popover.Header>
          <Popover.Body>
            {text}
          </Popover.Body>
        </Popover>
      }
    >
      <Button variant="default">
        <IoIosInformationCircleOutline color="#323637AD" size={20} />  
      </Button>
    </OverlayTrigger>
  )
}

const Button = styled(BsButton)`
&&& {
  padding: 0;
  &:hover > svg {
    color: #1F5462 !important;
  }
}
`

const Popover = styled(BsPopover)`
&&& {
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.15);
  padding: .75rem;
  max-width: 200px;

  .popover-header {
    margin: 0;
    background: none;
    padding: 0;
    border: none;

    font-family: 'Barlow Condensed';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: #1F5462;
  }

  .popover-body {
    padding: 0;
    font-family: 'Manrope';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 19px;
    color: #393D3E;
  }
}
`
