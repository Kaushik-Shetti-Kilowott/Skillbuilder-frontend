import React, { useEffect, useState } from "react";
import ManagePageHeader from "@ui-library/ManagePageHeader";
import Title from "@ui-library/Title";
import NotificationsAccordion from "@components/notifications/Accordion";
import Head from "next/head";
import HeaderSessionWidget from "@components/session-widgets/HeaderSessionWidget";
import { getPageFromWebflow, createReactPageFromHTML } from "@utils/helpers";
import ActivityService from "@services/activity.service";
import { useTeam } from "@contexts/TeamContext";
import { useQuery } from "react-query";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Authorization from "@contexts/Authorization";
import Error from "@components/error";
import styled from "styled-components";
import {
  Button as BsButton,
  Col,
  Container,
  InputGroup,
  Row,
  Badge,
} from "react-bootstrap";
import { DebounceInput } from "react-debounce-input";
import { IoSearchOutline } from "react-icons/io5";
import Tooltip from "@ui-library/Tooltip";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useAuthUser } from "@contexts/AuthContext";
import Bus from "@utils/Bus";

const Activity = () => {
  const { team } = useTeam();
  const { auth } = useAuthUser();
  const [searchKeyword, setSearchKeyword] = useState("");
  const { data, refetch: refetchActivitesNotifications } = useQuery(
    ["activities", { teamId: team?.id, searchString: searchKeyword }],
    () =>
      ActivityService.get(team?.id, {
        type: "all",
        searchString: searchKeyword,
        isActingSuperAdmin: localStorage.getItem('isSuperAdminView') === 'true' ? true:false
      }),
    {
      enabled: !!team?.id,
      onSuccess: (res) => {
        let count = 0;
        res
          .flatMap((e) => e)
          .forEach((e) => {
            if (
              e.groupType === "action_required" &&
              (e.type === "Flashcard_archive_action" ||
                e.type === "Question_merge_action" ||
                e.type === "Answer_merge_action")
            ) {
              count = count + 1;
            }
          });
        setUnreadGroupCount(count);
      },
      onError: (error) => {
        Bus.emit("error", { operation: "open", error: error.response });
      },
    }
  );

  useEffect(() => {
    if (document.addEventListener) {
      document.addEventListener(
        "flashcard-notification-click",
        refetchActivitesNotifications,
        false
      );
    } else {
      document.attachEvent(
        "flashcard-notification-click",
        refetchActivitesNotifications
      );
    }
  }, []);

  const [SelectedTab, setSelectedTab] = useState("All");
  const [type, setType] = useState("all");
  const tabNames = ["All", "Your Activity", "Action Required", "Archived"];
  const [unreadGroupCount, setUnreadGroupCount] = useState(null);

  const queryTypeFunction = (value) => {
    switch (value) {
      case "All":
        return "all";
      case "Your Activity":
        return "your_activity";
      case "Action Required":
        return "action_required";
      case "Archived":
        return "archived";
    }
  };

  const setSearchString = (value) => {
    setSearchKeyword(value);
  };
  const userName = auth?.user?.firstName + " " + auth?.user?.lastName;

  return (
    <Authorization allow={["member"]} fallback={data && <Error code={401} />}>
      <div className="bs">
        <ManagePageHeader />

        <Container>
          <Row className="mb-5 align-items-center" sm={3}>
            <Col className="d-flex align-items-center">
              <Title>Notification/Activity</Title>
            </Col>
          </Row>

          <Row className="mb-5 align-items-start">
            <Col className="col-12 col-lg-10 ">
              <div>
                <Row>
                  <Col className="col-12 col-lg-7">
                    <StyledTabs
                      className="bs mb-3"
                      defaultActiveKey="All"
                      id="notification-tabs"
                      justify
                      onSelect={(k) => {
                        setSelectedTab(k);
                        setType(queryTypeFunction(k));
                      }}
                    >
                      {tabNames.map((group, index) => (
                        <Tab
                          eventKey={group}
                          title={
                            <StyledtabHeader>
                              <span className="group-name">{group}</span>
                              <span className="badge">
                                {group === "Action Required" &&
                                  unreadGroupCount > 0 && (
                                    <NotificationCount bg="danger">
                                      {unreadGroupCount}
                                    </NotificationCount>
                                  )}
                              </span>
                            </StyledtabHeader>
                          }
                          key={index}
                        ></Tab>
                      ))}
                    </StyledTabs>
                  </Col>
                  <Col className="col-12 col-lg-2"></Col>
                  <Col className="col-12 col-lg-3">
                    <StyledInputGroup>
                      <InputGroup.Text>
                        <IoSearchOutline color="#003647" size={20} />
                      </InputGroup.Text>

                      <Input
                        type="search"
                        minLength={2}
                        debounceTimeout={300}
                        value={searchKeyword}
                        onChange={(e) => setSearchString(e.target.value)}
                        placeholder="Search by Keywords"
                        className="form-control"
                      />

                      {searchKeyword && (
                        <Tooltip text="Clear" placement="right">
                          <ClearButton
                            variant="default"
                            onClick={() => setSearchKeyword("")}
                          >
                            <IoIosCloseCircleOutline
                              color="#969C9D"
                              size={20}
                            />
                          </ClearButton>
                        </Tooltip>
                      )}
                    </StyledInputGroup>
                  </Col>
                </Row>
              </div>
              <AccordionContainer>
                {data && (
                  <NotificationsAccordion
                    activities={data}
                    type={type}
                    refetchActivitesNotifications={
                      refetchActivitesNotifications
                    }
                    userName={userName}
                    setUnreadGroupCount={setUnreadGroupCount}
                  />
                )}
              </AccordionContainer>
            </Col>
            <Col className="col-12 col-lg-2"></Col>
          </Row>
        </Container>
      </div>
    </Authorization>
  );
};

const instructions = {
  replace: (domNode) => {
    if (domNode.attribs && domNode.attribs.id === "detail") {
      return <Activity />;
    }

    if (domNode.attribs && domNode.attribs.id === "btn-my-account") {
      return <HeaderSessionWidget />;
    }
  },
};

export async function getStaticProps() {
  const { BODY, HEAD } = await getPageFromWebflow("/activity");

  return {
    props: { HEAD, BODY },
  };
}

export default function ActivityPage({ HEAD, BODY }) {
  return (
    <>
      <Head>{createReactPageFromHTML(HEAD)}</Head>
      <>{createReactPageFromHTML(BODY, instructions)}</>
    </>
  );
}
const StyledtabHeader = styled.div`
  &&& {
    position: relative;
    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
    }
  }
`;

const AccordionContainer = styled.div`
  margin-top: 50px;
`;

const StyledTabs = styled(Tabs)`
  &&& {
    border-bottom: none;
    width: 100%;
    flex-wrap: nowrap;
    .nav-link {
      color: #969c9d;
      font-family: "Barlow Condensed", sans-serif;
      font-style: normal;
      font-weight: 400;
      font-size: 20px;
      line-height: 24px;
      text-align: center;
    }
    .active {
      color: #003647;
      font-weight: 600;
      border-color: #fff #fff #003647 #fff;
      border-bottom-width: 3px;
    }
    @media (max-width: 768px) {
      width: 100%;
    }
  }
`;

const StyledInputGroup = styled(InputGroup)`
  &&& {
    color: #003647;
    font-family: "Barlow Condensed", sans-serif;
    border: 0.5px solid #003647;
    border-radius: 0.25rem;
    .input-group-text {
      background: none;
      border: none;
      padding: 0.375rem 0.5rem;
    }
  }
`;

const Input = styled(DebounceInput)`
  &&& {
    border: none;
    padding-left: 0;
  }
`;

const ClearButton = styled(BsButton)`
  &&& {
    display: flex;
    align-items: center;
    padding: 0 0.25rem;
  }
`;

const NotificationCount = styled(Badge)`
  &&& {
    border-radius: 50rem;
    background-color: #ff804a !important;
    //  position: absolute !important;
    // top: 2px !important;
    // left: 100%;
    // transform: translate(-50%, -50%);
    // font-family: Barlow Condensed;
    // font-style: normal;
    // font-weight: 600;
    // font-size: 14px;
  }
`;
