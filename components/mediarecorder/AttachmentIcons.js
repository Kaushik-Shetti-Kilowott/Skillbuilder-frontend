import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import drivelogoImg from "@public/images/google-drive.png";
import oneDrivelogoImg from "@ui-library/icons/onedrive.png";
import { BsQuestionCircle, BsInfoCircle } from "react-icons/bs";
import Tooltip from "@ui-library/Tooltip";
import videoIcon from "@public/svgs/videoIcon.svg";
import authService from "@services/auth.service";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthUser } from "@contexts/AuthContext";
import Bus from "@utils/Bus";

export default function AttachmentIcons({
  handleOpenPicker,
  setMediaParam,
  disableIcons,
  tokenInfo,
  setTokenInfo,
  googleTokenObject,
  setgoogleTokenObject,
  microsoftTokenObject,
  setMicrosoftTokenObject,
  tokens,
  refetchTokens,
}) {
  const { auth } = useAuthUser();

  const [externalWindow1, setExternalWindow1] = useState();
  const intervalRef1 = useRef();

  const [externalWindow2, setExternalWindow2] = useState();
  const intervalRef2 = useRef();

  const redirectURI = window.location.href;

  const googleDriveVerify = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive",
    hint: auth?.user?.email,
    flow: "auth-code",
    onSuccess: (codeResponse) => {
      authService
        .getToken(codeResponse.code)
        .then((res) => {
          refetchTokens();
          let temp = {
            isDriveAuthorize: true,
            isTokenExpired: false,
            tokenObject: res.data,
          };
          setgoogleTokenObject(temp);
          temp = {
            googleTokenObject: temp,
            microsoftTokenObject: microsoftTokenObject,
          };
          setTokenInfo(temp);
        })
        .catch((error) => {
          Bus.emit("error", {
            operation: "open",
            error: error.response,
          });
        });
    },
    onError: (error) => {
      Bus.emit("error", { operation: "open", error: error.response });
    },
  });

  const clearTimer1 = () => {
    window.clearInterval(intervalRef1.current);
  };

  const createPopup1 = () => {
    const width = 500;
    const height = 500;
    const title = `WINDOW TITLE`;
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_ONE_DRIVE_CLIENTID}&scope=Files.ReadWrite,Files.ReadWrite.All,offline_access&response_type=code&redirect_uri=${redirectURI}`;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    const externalPopup = window.open(
      url,
      title,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    return externalPopup;
  };
  const connectToOneDrive = () => {
    setExternalWindow1(createPopup1());
  };

  const clearTimer2 = () => {
    window.clearInterval(intervalRef2.current);
  };
  const createPopup2 = () => {
    const width = 500;
    const height = 500;
    const title = `WINDOW TITLE`;
    const url2 = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_ONE_DRIVE_CLIENTID}&scope=OneDrive.ReadWrite,offline_access&response_type=code&redirect_uri=${redirectURI}`;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    const externalPopup2 = window.open(
      url2,
      title,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    return externalPopup2;
  };
  const connectToOneDriveFilePIcker = () => {
    setExternalWindow2(createPopup2());
  };

  useEffect(() => {
    if (externalWindow1) {
      intervalRef1.current = window.setInterval(() => {
        try {
          const currentUrl = externalWindow1.location.href;
          const params = new URL(currentUrl).searchParams;
          const code = params.get("code");
          if (!code) {
            return;
          }
          console.log("code", code);
          if (code) {
            authService
              .getMSToken(code, 1)
              .then(function (response) {
                refetchTokens();
                connectToOneDriveFilePIcker();
                console.log("first api success");
              })
              .catch(function (error) {
                console.log(error);
              });
          }

          clearTimer1();
          externalWindow1.close();
        } catch (error) {
          // eslint-ignore-line
        } finally {
          if (!externalWindow1 || externalWindow1.closed) {
            clearTimer1();
          }
        }
      }, 700);
    }
    return () => {
      if (externalWindow1) externalWindow1.close();
    };
  }, [externalWindow1]);

  useEffect(() => {
    if (externalWindow2) {
      intervalRef2.current = window.setInterval(() => {
        try {
          const currentUrl = externalWindow2.location.href;
          const params = new URL(currentUrl).searchParams;
          const code = params.get("code");
          if (!code) {
            return;
          }
          console.log("code", code);
          if (code) {
            authService
              .getMSToken(code, 2)
              .then(function (response) {
                refetchTokens();

                console.log("second api success");
              })
              .catch(function (error) {
                console.log(error);
              });
          }

          clearTimer2();
          externalWindow2.close();
        } catch (error) {
          // eslint-ignore-line
        } finally {
          if (!externalWindow2 || externalWindow2.closed) {
            clearTimer2();
          }
        }
      }, 700);
    }
    return () => {
      if (externalWindow2) externalWindow2.close();
    };
  }, [externalWindow2]);

  const baseUrl = "https://onedrive.live.com/picker";
  let win = null;
  let port = null;

  const options = {
    sdk: "8.0",
    entry: {
      oneDrive: {
        files: {},
      },
    },
    authentication: {},
    messaging: {
      origin: "http://localhost:3000",
      channelId: "27",
    },
    selection: {
      mode: "multiple",
    },
    typesAndSources: {
      mode: "files",
      pivots: {
        oneDrive: true,
        recent: true,
      },
    },
  };

  const pickerCode = () => {
    win = window.open("", "Picker", "width=1080,height=680");

    const queryString = new URLSearchParams({
      filePicker: JSON.stringify(options),
      locale: "en-us",
    });
    const url = `${baseUrl}?${queryString}`;

    const form = win.document.createElement("form");
    form.setAttribute("action", url);
    form.setAttribute("method", "POST");

    const tokenInput = win.document.createElement("input");
    tokenInput.setAttribute("type", "hidden");
    tokenInput.setAttribute("name", "access_token");

    tokenInput.setAttribute(
      "value",
      tokens.microsoftTokenObject.tokenObject.onedriveToken.access_token
    );

    form.appendChild(tokenInput);
    win.document.body.append(form);
    form.submit();

    /*window.addEventListener("message", (event) => {
      if (event.source && event.source === win) {
        const message = event.data;

        if (
          message.type === "initialize" &&
          message.channelId === options.messaging.channelId
        ) {
          port = event.ports[0];

          port.addEventListener("message", messageListener);

          port.start();

          port.postMessage({
            type: "activate",
          });
        }
      }
    });*/
  };

  async function messageListener(message) {
    switch (message.data.type) {
      case "notification":
        console.log(`notification: ${message.data}`);
        break;

      case "command":
        port.postMessage({
          type: "acknowledge",
          id: message.data.id,
        });

        const command = message.data.data;

        switch (command.command) {
          case "authenticate":
            if (
              typeof tokens.microsoftTokenObject.tokenObject.onedriveToken
                .access_token !== "undefined" &&
              tokens.microsoftTokenObject.tokenObject.onedriveToken
                .access_token !== null
            ) {
              port.postMessage({
                type: "result",
                id: message.data.id,
                data: {
                  result: "token",
                  token:
                    tokens.microsoftTokenObject.tokenObject.onedriveToken
                      .access_token,
                },
              });
            } else {
              console.error(
                `Could not get auth token for command: ${JSON.stringify(
                  command
                )}`
              );
            }

            break;

          case "close":
            win.close();
            break;

          case "pick":
            const ArrayIDs = [];
            command.items.forEach(function (arrayItem) {
              ArrayIDs.push(arrayItem.id);

              console.log(ArrayIDs);
            });

            console.log(`Picked: ${JSON.stringify(command)}`);

            port.postMessage({
              type: "result",
              id: message.data.id,
              data: {
                result: "success",
              },
            });

            win.close();

            break;

          default:
            console.warn(`Unsupported command: ${JSON.stringify(command)}`, 2);

            port.postMessage({
              result: "error",
              error: {
                code: "unsupportedCommand",
                message: command.command,
              },
              isExpected: true,
            });
            break;
        }
        break;
      default:
        break;
    }
  }
  return (
    <StyledAttachmentIcons>
      {tokenInfo !== undefined &&
      googleTokenObject?.isDriveAuthorize &&
      !googleTokenObject?.isTokenExpired ? (
        <div className="d-flex align-items-center wrap">
          <Button
            onClick={async () => {
              setMediaParam({
                video: true,
                audio: true,
                selected: "video",
                type: "video/mp4",
              });
            }}
          >
            <img
              src={videoIcon.src}
              alt="videoIcon"
              style={{
                width: "100%",
                height: "auto",
                maxWidth: 20,
                color:
                  (googleTokenObject?.tokenObject === undefined &&
                    !googleTokenObject?.isDriveVerfied &&
                    !googleTokenObject?.isTokenExpired) ||
                  !googleTokenObject?.isDriveVerfied ||
                  disableIcons
                    ? "#969C9D"
                    : "#444",
              }}
            />
            Record Media
          </Button>

          <Button
            onClick={async () => {
              handleOpenPicker();
              setMediaParam({
                video: false,
                audio: false,
                selected: "",
                type: "",
              });
            }}
          >
            <img
              src={drivelogoImg.src}
              style={{
                width: "100%",
                height: "auto",
                maxWidth: 20,
              }}
            />
            Google Drive
          </Button>

          <Tooltip text="With Google Drive Picker you can add attachments from your Google Drive account OR drag-drop files from your device using the upload feature.">
            <span>
              <BsInfoCircle color="#555" size={16} />
            </span>
          </Tooltip>
        </div>
      ) : (
        <div className="wrap">
          <Button
            className="authButton"
            onClick={async () => {
              if (
                googleTokenObject?.isTokenExpired &&
                googleTokenObject?.isDriveVerfied
              ) {
                authService
                  .getRefreshToken(
                    googleTokenObject?.tokenObject?.refresh_token
                  )
                  .then((res) => {
                    let temp = {
                      isDriveAuthorize: true,
                      isTokenExpired: false,
                      tokenObject: res,
                    };
                    setgoogleTokenObject(temp);
                    temp = {
                      googleTokenObject: temp,
                      microsoftTokenObject: microsoftTokenObject,
                    };
                    setTokenInfo(temp);
                    openPickerClick();
                    localStorage.setItem("tokenInfo", JSON.stringify(temp));
                  })
                  .catch((err) => {
                    alert(err);
                  });
              } else {
                googleDriveVerify();
              }
            }}
          >
            <img
              src={drivelogoImg.src}
              style={{
                width: "100%",
                height: "auto",
                maxWidth: 20,
              }}
            />
            Connect to GoogleDrive
          </Button>
        </div>
      )}

      {/* {tokens !== undefined && tokens.microsoftTokenObject?.isDriveAuthorize ? (
        <Button
          onClick={async () => {
            pickerCode();
            setMediaParam({
              video: false,
              audio: false,
              selected: "",
              type: "",
            });
          }}
        >
          <img
            src={oneDrivelogoImg.src}
            style={{
              width: "100%",
              height: "auto",
              maxWidth: 20,
            }}
          />
          OneDrive picker
        </Button>
      ) : (
        <Button
          onClick={async () => {
            connectToOneDrive();
            setMediaParam({
              video: false,
              audio: false,
              selected: "",
              type: "",
            });
          }}
        >
          <img
            src={oneDrivelogoImg.src}
            style={{
              width: "100%",
              height: "auto",
              maxWidth: 20,
            }}
          />
          Connect to OneDrive
        </Button>
      )} */}
    </StyledAttachmentIcons>
  );
}

const StyledAttachmentIcons = styled.div`
  .disabled {
    pointer-events: none;
    cursor: disabled;
    opacity: 0.5;
  }
  img {
    cursor: pointer;
    margin-right: 5px;
  }
  span {
    line-height: 1;
  }
  .authButton {
    padding: 0 10px;
    img {
      margin: 0;
    }
  }
  .wrap {
    flex-wrap: wrap;
  }
`;

const Button = styled.button`
  background: transparent;
  border: 1px solid #c0c0c0;
  border-radius: 5px !important;
  margin: 0 3px !important;
  font-family: Barlow Condensed !important;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  color: #393d3e;
  min-width: 100px;
`;
