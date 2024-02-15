// import React from 'react';
// import { useNoticesQuery } from "./generated/graphql";
import { useNoticeQuery } from "./generated/graphql";
import React, { useEffect } from "react";
import { ethers } from "ethers";

interface NoticeResponseProps {
  conversationId: number;
  responseId: number;
  reloadNotice?: React.MutableRefObject<() => void>;
}

export const NoticeResponse: React.FC<NoticeResponseProps> = ({ conversationId, responseId, reloadNotice }) => {
  const [noticeResult, reexecuteNoticeQuery] = useNoticeQuery({
    variables: { noticeIndex: responseId, inputIndex: conversationId }
  });
  const [promptLLMResponse, setPromptLLMResponse] = React.useState<any>();


  useEffect(() => {
    if (!noticeResult.fetching && noticeResult.data) {
      const n = noticeResult.data.notice;
      let payloadHuman = n?.payload;
      if (payloadHuman) {
        try {
          payloadHuman = ethers.utils.toUtf8String(payloadHuman);
        } catch (e) {
          payloadHuman = payloadHuman + " (hex)";
        }
      } else {
        payloadHuman = "(empty)";
      }
      setPromptLLMResponse(JSON.parse(payloadHuman).promptLLMResponse);
    }
  }, [noticeResult]);

  useEffect(() => {
    if (reloadNotice) {
      reloadNotice.current = reload;
    }
  }, [reloadNotice]);
  const reload = () => {
    reexecuteNoticeQuery({ requestPolicy: 'network-only' });
  }

  // console.log("promptLLMResponse", promptLLMResponse);

  return <span>
    Off-Chain:
    <span style={{ fontStyle: 'italic' }}> {promptLLMResponse ? promptLLMResponse : "waiting for the notice"}</span>
  </span>;
};
