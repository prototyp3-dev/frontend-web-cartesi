// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { ethers } from "ethers";
import React from "react";
import { useReportsQuery } from "./generated/graphql";

type Report = {
    id: string;
    index: number;
    input: any, //{index: number; epoch: {index: number; }
    payload: string;
};

export const Reports: React.FC = () => {
    const [result,reexecuteQuery] = useReportsQuery();
    const { data, fetching, error } = result;

    if (fetching) return <p>Loading...</p>;
    if (error) return <p>Oh no... {error.message}</p>;

    if (!data || !data.reports) return <p>No reports</p>;

    const reports: Report[] = data.reports.edges.map((node: any) => {
        const n = node.node;
        let inputPayload = n?.input.payload;
        if (inputPayload) {
            try {
                inputPayload = ethers.utils.toUtf8String(inputPayload);
            } catch (e) {
                inputPayload = inputPayload + " (hex)";
            }
        } else {
            inputPayload = "(empty)";
        }
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
        return {
            id: `${n?.id}`,
            index: parseInt(n?.index),
            payload: `${payload}`,
            input: n ? {index:n.input.index,payload: inputPayload} : {},
        };
    }).sort((b: any, a: any) => {
        if (a.input.index === b.input.index) {
            return b.index - a.index;
        } else {
            return b.input.index - a.input.index;
        }
    });

    // const forceUpdate = useForceUpdate();
    return (
        <div>
            <button onClick={() => reexecuteQuery({ requestPolicy: 'network-only' })}>
                Reload
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Input Index</th>
                        <th>Notice Index</th>
                        {/* <th>Input Payload</th> */}
                        <th>Payload</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.length === 0 && (
                        <tr>
                            <td colSpan={4}>no reports</td>
                        </tr>
                    )}
                    {reports.map((n: any) => (
                        <tr key={`${n.input.index}-${n.index}`}>
                            <td>{n.input.index}</td>
                            <td>{n.index}</td>
                            {/* <td>{n.input.payload}</td> */}
                            <td>{n.payload}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};
