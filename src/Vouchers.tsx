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
import React, { useEffect } from "react";
import { useVouchersQuery, useVoucherQuery } from "./generated/graphql";
import { useRollups } from "./useRollups";

type Voucher = {
    id: string;
    index: number;
    destination: string;
    input: any, //{index: number; epoch: {index: number; }
    payload: string;
    proof: any;
    executed: any;
};

interface IVoucherPropos {
    dappAddress: string 
}

export const Vouchers: React.FC<IVoucherPropos> = (propos) => {
    const [result,reexecuteQuery] = useVouchersQuery();
    const [voucherToFetch, setVoucherToFetch] = React.useState([0,0]);
    const [voucherResult,reexecuteVoucherQuery] = useVoucherQuery({
        variables: { voucherIndex: voucherToFetch[0], inputIndex: voucherToFetch[1] }//, pause: !!voucherIdToFetch
    });
    const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
    const { data, fetching, error } = result;
    const rollups = useRollups(propos.dappAddress);

    const getProof = async (voucher: Voucher) => {
        setVoucherToFetch([voucher.index,voucher.input.index]);
        reexecuteVoucherQuery({ requestPolicy: 'network-only' });
    };

    const executeVoucher = async (voucher: any) => {
        if (rollups && !!voucher.proof) {

            const newVoucherToExecute = {...voucher};
            try {
                const tx = await rollups.dappContract.executeVoucher( voucher.destination,voucher.payload,voucher.proof);
                const receipt = await tx.wait();
                console.log(tx,receipt);
                newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
                if (receipt.events) {
                    newVoucherToExecute.msg = `${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`;
                    console.log(`MSG ${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`);
                }
            } catch (e) {
                newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
                console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
            }
            setVoucherToExecute(newVoucherToExecute);
        }
    }

    useEffect( () => {
        const getExecutedAndSetVoucher = async (voucher: any) => {
            if (rollups) {
                console.log("voucher",voucher)
                rollups.dappContract.wasVoucherExecuted(voucher.inputIndex,voucher.outputIndex);
                voucher.executed = false;
            }
            setVoucherToExecute(voucher);
        }
    
        if (!voucherResult.fetching && voucherResult.data){
            getExecutedAndSetVoucher(voucherResult.data.voucher);
        }
    },[voucherResult, rollups]);

    if (fetching) return <p>Loading...</p>;
    if (error) return <p>Oh no... {error.message}</p>;

    if (!data || !data.vouchers) return <p>No vouchers</p>;

    const vouchers: Voucher[] = data.vouchers.edges.map((node: any) => {
        const n = node.node;
        let payload = n?.payload;
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
        if (payload) {
            const decoder = new ethers.utils.AbiCoder();
            const selector = decoder.decode(["bytes4"], payload)[0]; 
            payload = ethers.utils.hexDataSlice(payload,4);
            try {
                switch(selector) { 
                    case '0xa9059cbb': { 
                        // erc20 transfer; 
                        const decode = decoder.decode(["address","uint256"], payload);
                        payload = `Erc20 Transfer - Amount: ${ethers.utils.formatEther(decode[1])} - Address: ${decode[0]}`;
                        break; 
                    }
                    case '0x42842e0e': { 
                        //erc721 safe transfer;
                        const decode = decoder.decode(["address","address","uint256"], payload);
                        payload = `Erc721 Transfer - Id: ${decode[2]} - Address: ${decode[1]}`;
                        break; 
                    }
                    case '0x74956b94': { 
                        //ether transfer; 
                        const decode = decoder.decode(["bytes"], payload)
                        const decode2 = decoder.decode(["address", "uint256"], decode[0])
                        payload = `Ether Transfer - Amount: ${ethers.utils.formatEther(decode2[1])} (Native eth) - Address: ${decode2[0]}`;
                        break; 
                    }
                    case '0xd0def521': { 
                        //erc721 mint;
                        const decode = decoder.decode(["address","string"], payload);
                        payload = `Mint Erc721 - String: ${decode[1]} - Address: ${decode[0]}`;
                        break; 
                    }
                    case '0x755edd17': { 
                        //erc721 mintTo;
                        const decode = decoder.decode(["address"], payload);
                        payload = `Mint Erc721 - Address: ${decode[0]}`;
                        break; 
                    }
                    default: {
                        break; 
                    }
                }
            } catch (e) {
                console.log(e);
            }
        } else {
            payload = "(empty)";
        }
        return {
            id: `${n?.id}`,
            index: parseInt(n?.index),
            destination: `${n?.destination ?? ""}`,
            payload: `${payload}`,
            input: n ? {index:n.index,payload: inputPayload} : {},
            proof: null,
            executed: null,
        };
    }).sort((b: any, a: any) => {
        if (a.input === b.input) {
            return a.voucher - b.voucher;
        } else {
            return a.input - b.input;
        }
    });

    // const forceUpdate = useForceUpdate();
    return (
        <div>
            <p>Voucher to execute</p>
        {voucherToExecute ? <table>
            <thead>
                <tr>
                    <th>Input Index</th>
                    <th>Voucher Index</th>
                    <th>Voucher Id</th>
                    <th>Destination</th>
                    <th>Action</th>
                    {/* <th>Payload</th> */}
                    {/* <th>Proof</th> */}
                    <th>Input Payload</th>
                    <th>Msg</th>
                </tr>
            </thead>
            <tbody>
                <tr key={`${voucherToExecute.input.index}-${voucherToExecute.index}`}>
                    <td>{voucherToExecute.input.index}</td>
                    <td>{voucherToExecute.index}</td>
                    <td>{voucherToExecute.id}</td>
                    <td>{voucherToExecute.destination}</td>
                    <td>
                        <button disabled={!voucherToExecute.proof || voucherToExecute.executed} onClick={() => executeVoucher(voucherToExecute)}>{voucherToExecute.proof ? (voucherToExecute.executed ? "Voucher executed" : "Execute voucher") : "No proof yet"}</button>
                    </td>
                    {/* <td>{voucherToExecute.payload}</td> */}
                    {/* <td>{voucherToExecute.proof}</td> */}
                    <td>{voucherToExecute.input.payload}</td>
                    <td>{voucherToExecute.msg}</td>
                </tr>
            </tbody>
        </table> : <p>Nothing yet</p>}
            <button onClick={() => reexecuteQuery({ requestPolicy: 'network-only' })}>
                Reload
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Input Index</th>
                        <th>Voucher Index</th>
                        <th>Voucher Id</th>
                        <th>Destination</th>
                        <th>Action</th>
                        <th>Input Payload</th>
                        <th>Payload</th>
                        {/* <th>Proof</th> */}
                    </tr>
                </thead>
                <tbody>
                    {vouchers.length === 0 && (
                        <tr>
                            <td colSpan={4}>no vouchers</td>
                        </tr>
                    )}
                    {vouchers.map((n: any) => (
                        <tr key={`${n.input.index}-${n.index}`}>
                            <td>{n.input.index}</td>
                            <td>{n.index}</td>
                            <td>{n.id}</td>
                            <td>{n.destination}</td>
                            <td>
                                <button onClick={() => getProof(n)}>Get Proof</button>
                            </td>
                            <td>{n.input.payload}</td>
                            <td>{n.payload}</td>
                            {/* <td>
                                <button disabled={!!n.proof} onClick={() => executeVoucher(n)}>Execute voucher</button>
                            </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};
