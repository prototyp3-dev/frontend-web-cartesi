import React from 'react';
import { useNoticesQuery } from "./generated/graphql";
import { ethers } from "ethers";

interface NoticeResponseProps {
    conversationId: number;
    responseId: number;
}

export const NoticeResponse: React.FC<NoticeResponseProps> = ({ conversationId, responseId }) => {
    const { data, fetching, error } = useNoticesQuery();

    if (fetching) return <span>N/A</span>;
    if (error) return <span>N/A</span>;

    const notice = data?.notices.edges.find((node: any) => {
        const n = node.node;
        return parseInt(n.input.index) === conversationId && parseInt(n.index) === responseId;
    });

    if (!notice) return <span>N/A</span>;

    let payload = notice.node.payload;
    try {
        payload = ethers.utils.toUtf8String(payload);
    } catch (e) {
        payload = "N/A"; // In case the payload is not a valid UTF-8 string
    }

    return <span style={{ fontStyle: 'italic' }}>{payload}</span>;
};
