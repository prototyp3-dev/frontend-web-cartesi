// import React from 'react';
// import { useNoticesQuery } from "./generated/graphql";
import { useNoticeQuery } from "./generated/graphql";
import React, { useEffect } from "react";
import { ethers } from "ethers";

interface NoticeResponseProps {
  conversationId: number;
  responseId: number;
}

export const NoticeResponse: React.FC<NoticeResponseProps> = ({ conversationId, responseId }) => {
  const [noticeResult, reexecuteNoticeQuery] = useNoticeQuery({
    variables: { noticeIndex: responseId, inputIndex: conversationId }
  });
  const [payloadHuman, setPayloadHuman] = React.useState<any>();


  useEffect(() => {
    if (!noticeResult.fetching && noticeResult.data) {
      const n = noticeResult.data.notice;
      let payload = n?.payload;
      if (payload) {
        try {
          payload = ethers.utils.toUtf8String(payload);
        } catch (e) {
          payload = payload + " (hex)";
        }
      } else {
        payload = "(empty)";
      }
      setPayloadHuman(payload);
    }
  }, [noticeResult]);

  console.log("payloadHuman", payloadHuman);

  return <span style={{ fontStyle: 'italic' }}>{payloadHuman}</span>;
};
