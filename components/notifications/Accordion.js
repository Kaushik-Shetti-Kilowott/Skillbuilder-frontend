import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Accordion as BsAccordion } from "react-bootstrap";
import { useMutation, useQueryClient } from "react-query";
import { useTeam } from "@contexts/TeamContext";
import notificationService from "@services/notification.service";
import ActivityItem from "./ActivityItem";
import Bus from "@utils/Bus";

export default function NotificationsAccordion({
  activities,
  type,
  refetchActivitesNotifications,
  userName,
}) {
  return (
    <>
      <Accordion defaultActiveKey={[0]} flush alwaysOpen>
        {activities?.map((activityList, idx) => (
          <AccordionItem
            index={idx}
            notifications={activityList.filter((e) => {
              if (type === "all") {
                return e;
              } else {
                if (e.groupType === type) {
                  return e;
                }
              }
            })}
            key={idx}
            refetchActivitesNotifications={refetchActivitesNotifications}
            userName={userName}
          />
        ))}
      </Accordion>
    </>
  );
}

const AccordionItem = ({
  notifications,
  index,
  refetchActivitesNotifications,
  userName,
}) => {
  const { team } = useTeam();

  const mutation = useMutation(
    (notificationIds) => notificationService.update(team.id, notificationIds),
    {
      onSuccess: () => {
        refetchActivitesNotifications && refetchActivitesNotifications();
      },
      onError:(error) => {
				Bus.emit("error", { operation: "open",error:error.response});
			}
    }
  );

  const markAsRead = useCallback(() => {
    if (!mutation.isLoading) {
      let unread = notifications?.map((_notif) => !_notif.isRead && _notif.id);
      unread = unread.filter((_id) => _id);

      if (unread.length) {
        mutation.mutate(unread);
      }
    }
  }, []);

  useEffect(() => {
    if (index === 0) {
      markAsRead();
    }
  }, []);

  return (
    <>
      {notifications.length > 0 && (
        <Accordion.Item eventKey={index} onClick={() => markAsRead()}>
          <Accordion.Header>{notifications[0]?.month}</Accordion.Header>
          <Accordion.Body>
            {notifications.map((notif, idx) => (
              <ActivityItem
                {...notif}
                key={idx}
                onPage={true}
                refetchActivitesNotifications={refetchActivitesNotifications}
                userName={userName}
              />
            ))}
          </Accordion.Body>
        </Accordion.Item>
      )}
    </>
  );
};

const Accordion = styled(BsAccordion)`
  &&& {
    .accordion-header > button {
      background: #81c2c0;
      padding: 0.1rem 0.8rem;
      padding-left: 1.5rem;

      font-family: "Barlow Condensed";
      font-style: normal;
      font-weight: 500;
      font-size: 18px;
      line-height: 34px;
      color: #ffffff;

      &::after {
        filter: brightness(730%) sepia(100%) hue-rotate(161deg) saturate(23%);
      }
    }

    .accordion-body {
      padding: 0;
      & > * {
        border-bottom: 0.5px solid #969c9d;
      }
    }
  }
`;
