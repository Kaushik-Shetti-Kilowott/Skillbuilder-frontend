import React, { useState } from "react";
import { useFormikContext } from "formik";
import dynamic from "next/dynamic";
import AttachmentIcons from "@components/mediarecorder/AttachmentIcons";
import getConfig from "next/config";
import { GoogleOAuthProvider } from "@react-oauth/google";
import useDrivePicker from "react-google-drive-picker";
import AttachmentList from "@components/mediarecorder/AttachmentList";
import authService from "@services/auth.service";
import Bus from "@utils/Bus";
import answerService from "@services/answer.service";
import { useTokens } from "@contexts/TokensContext";

const TextEditor = dynamic(() => import("@ui-library/TextEditor"), {
  ssr: false,
});
const Recorder = dynamic(
  () => import("@components/mediarecorder/MediaRecorderComponent.js"),
  { ssr: false }
);

const {
  publicRuntimeConfig: { GOOGLE_CLIENT_ID },
} = getConfig();

export default function AnswerEditor() {
  const formik = useFormikContext();
  const { tokens, refetchTokens, setTokens } = useTokens();
  const [openPicker, authResponse] = useDrivePicker();
  const [mediaSelection, setMediaSelection] = useState({
    video: false,
    audio: false,
    selected: "",
    type: "",
  });
  const [answerAttachment, setanswerAttachment] = useState(
    formik.values.attachment ? formik.values.attachment : []
  );

  const [tokenInfo, setTokenInfo] = useState(tokens? tokens: null);
  const [googleTokenObject, setgoogleTokenObject] = useState(tokenInfo? tokens.googleTokenObject : null);

  const [microsoftTokenObject, setMicrosoftTokenObject] = useState(tokenInfo? tokens.microsoftTokenObject: null);

  const [disableIcons, setDisableIcons] = useState(false);

  const validatePickerClick = () => {
    if (googleTokenObject?.isTokenExpired) {
      authService
        .getRefreshToken(googleTokenObject?.tokenObject?.refresh_token)
        .then((res) => {
          refetchTokens();
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
        })
        .catch((error) => {
          Bus.emit("error", {
            operation: "open",
            error: error.response,
          });
        });
    } else {
      openPickerClick();
    }
  };

  const handleAttachment = (data, atype) => {
    const allowedMimeTypes = [
      "video/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.google-apps.document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.google-apps.presentation",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    let dataObj = [];
    if (atype == "google") dataObj = data.docs;
    else dataObj = data.value;

    if (dataObj.length > 0) {
      let fileIds = [];
      let fileObjs = [];
      let formikObj = [];
      dataObj.map((fileItem, key) => {
        let mFile = "";
        if (atype == "onedrive") mFile = oneDriveTransformer(fileItem);
        else mFile = fileItem;

        if (allowedMimeTypes.includes(mFile.mimeType)) {
          const copy = answerAttachment.filter((e) => {
            if (e.id !== mFile.id) {
              return e;
            } else {
              // eslint-ignore-line
              // alert(mFile.name + " attachment already added");
            }
          });
          if (key == 0) fileObjs = [...copy, mFile];
          else fileObjs = [...fileObjs, mFile];
          setanswerAttachment(fileObjs);
        } else {
          // eslint-ignore-line
          // alert(file.name + " file format not allowed.");
        }
      });
      fileObjs.forEach((el) => {
        fileIds = [...fileIds, el.id];
        formikObj = [
          ...formikObj,
          {
            id: el.id,
            mimeType: el.mimeType,
            name: el.name,
            url: el.url !== undefined ? el.url : "",
            type: atype,
          },
        ];
      });

      formik.setFieldValue("attachment", formikObj);
      if (fileIds.length > 0 && atype == "google")
        answerService
          .grantAccess(fileIds)
          .then((res) => {})
          .catch((error) => {
            Bus.emit("error", {
              operation: "open",
              error: error.response,
            });
          });
    }
  };

  const openPickerClick = () => {
    openPicker({
      clientId: GOOGLE_CLIENT_ID,
      developerKey: "AIzaSyDoqS6OiXvYLXmv0HWlHuosHEbPQ-Cie0E",
      viewId: "DOCS",
      token:
        googleTokenObject?.tokenObject &&
        googleTokenObject?.tokenObject?.access_token
          ? googleTokenObject?.tokenObject?.access_token
          : "",
      showUploadView: true,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: true,
      callbackFunction: (data) => {
        var elements = document.getElementsByClassName("picker-dialog");
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.zIndex = "2000";
        }
        if (data.docs) {
          handleAttachment(data, "google");
        }
      },
    });
  };

  return (
    <div className="d-flex flex-column" style={{ height: "100%" }}>
      <div className="d-block" style={{ position: "relative", height: "100%" }}>
        <div className="row">
          <div className="col-md-6">
            <TextEditor
              value={formik.values.answer}
              onChange={(value) => formik.setFieldValue("answer", value)}
            />
          </div>
          <div className="col-md-6">
            <div
              style={{
                padding: "12px",
                borderLeft: "1px solid #969C9D",
                height: "100%",
              }}
            >
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <AttachmentIcons
                  handleOpenPicker={validatePickerClick}
                  setMediaParam={setMediaSelection}
                  disableIcons={disableIcons}
                  handleAttachment={handleAttachment}
                  tokenInfo={tokenInfo}
                  setTokenInfo={setTokenInfo}
                  googleTokenObject={googleTokenObject}
                  setgoogleTokenObject={setgoogleTokenObject}
                  microsoftTokenObject={microsoftTokenObject}
                  setMicrosoftTokenObject={setMicrosoftTokenObject}
                  refetchTokens={refetchTokens}
                  tokens={tokens}
                  setTokens={setTokens}
                />
              </GoogleOAuthProvider>
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <Recorder
                  selection={mediaSelection}
                  setMediaParam={setMediaSelection}
                  attachments={answerAttachment}
                  setAttachments={setanswerAttachment}
                  setDisableIcons={setDisableIcons}
                  tokenInfo={tokenInfo}
                  setTokenInfo={setTokenInfo}
                  googleTokenObject={googleTokenObject}
                  setgoogleTokenObject={setgoogleTokenObject}
                  microsoftTokenObject={microsoftTokenObject}
                  setMicrosoftTokenObject={setMicrosoftTokenObject}
                  refetchTokens={refetchTokens}
                />
              </GoogleOAuthProvider>
              <AttachmentList
                attachments={answerAttachment}
                setAttachments={setanswerAttachment}
                isFromEditor={true}
                arrows={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
