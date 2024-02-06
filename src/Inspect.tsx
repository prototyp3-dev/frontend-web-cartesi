// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import React, { useState } from "react";
import { useSetChain } from "@web3-onboard/react";
import { ethers } from "ethers";
// import { useRollups } from "./useRollups";

import configFile from "./config.json";

const config: any = configFile;

export const Inspect: React.FC = () => {
    // const rollups = useRollups();
    const [{ connectedChain }] = useSetChain();
    const inspectCall = async (str: string) => {
        let payload = str;
        if (hexData) {
            const uint8array = ethers.utils.arrayify(str);
            payload = new TextDecoder().decode(uint8array);
        }
        if (!connectedChain){
            return;
        }
        
        let apiURL= ""

        if(config[connectedChain.id]?.inspectAPIURL) {
            apiURL = `${config[connectedChain.id].inspectAPIURL}/inspect`;
        } else {
            console.error(`No inspect interface defined for chain ${connectedChain.id}`);
            return;
        }
        
        let fetchData: Promise<Response>;
        if (postData) {
            const payloadBlob = new TextEncoder().encode(payload);
            fetchData = fetch(`${apiURL}`, { method: 'POST', body: payloadBlob });
        } else {
            fetchData = fetch(`${apiURL}/${payload}`);
        }
        fetchData
            .then(response => response.json())
            .then(data => {
                setReports(data.reports);
                setMetadata({metadata:data.metadata, status: data.status, exception_payload: data.exception_payload});
            });
    };
    const [inspectData, setInspectData] = useState<string>("");
    const [reports, setReports] = useState<string[]>([]);
    const [metadata, setMetadata] = useState<any>({});
    const [hexData, setHexData] = useState<boolean>(false);
    const [postData, setPostData] = useState<boolean>(false);

    return (
        <div>
            <div>
                <input
                    type="text"
                    value={inspectData}
                    onChange={(e) => setInspectData(e.target.value)}
                />
                <input type="checkbox" checked={hexData} onChange={(e) => setHexData(!hexData)}/><span>Raw Hex </span>
                <input type="checkbox" checked={postData} onChange={(e) => setPostData(!postData)}/><span>POST </span>
                <button onClick={() => inspectCall(inspectData)}>
                    Send
                </button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Active Epoch Index</th>
                        <th>Curr Input Index</th>
                        <th>Status</th>
                        <th>Exception Payload</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{metadata.metadata ? metadata.metadata.active_epoch_index : ""}</td>
                        <td>{metadata.metadata ? metadata.metadata.current_input_index : ""}</td>
                        <td>{metadata.status}</td>
                        <td>{metadata.exception_payload ? ethers.utils.toUtf8String(metadata.exception_payload): ""}</td>
                    </tr>
                </tbody>
            </table>

            <table>
                <tbody>
                    {reports?.length === 0 && (
                        <tr>
                            <td colSpan={4}>no reports</td>
                        </tr>
                    )}
                    {reports?.map((n: any) => (
                        <tr key={`${n.payload}`}>
                            <td>{ethers.utils.toUtf8String(n.payload)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
