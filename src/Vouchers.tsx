// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { BigNumber, ethers } from "ethers";
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
                newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
                if (receipt.events) {
                    newVoucherToExecute.msg = `${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`;
                    newVoucherToExecute.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index),BigNumber.from(voucher.index));
                }
            } catch (e) {
                newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
                console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
            }
            setVoucherToExecute(newVoucherToExecute);
        }
    }

    useEffect( () => {
        const setVoucher = async (voucher: any) => {
            if (rollups) {
                voucher.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index),BigNumber.from(voucher.index));
            }
            setVoucherToExecute(voucher);
        }
    
        if (!voucherResult.fetching && voucherResult.data){
            setVoucher(voucherResult.data.voucher);
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
                    case '0x522f6815': { 
                        //ether transfer; 
                        const decode2 = decoder.decode(["address", "uint256"], payload)
                        payload = `Ether Transfer - Amount: ${ethers.utils.formatEther(decode2[1])} (Native eth) - Address: ${decode2[0]}`;
                        break; 
                    }
                    case '0xf242432a': { 
                        //erc155 single safe transfer;
                        const decode = decoder.decode(["address","address","uint256","uint256"], payload);
                        payload = `Erc1155 Single Transfer - Id: ${decode[2]} Amount: ${decode[3]} - Address: ${decode[1]}`;
                        break; 
                    }
                    case '0x2eb2c2d6': { 
                        //erc155 Batch safe transfer;
                        const decode = decoder.decode(["address","address","uint256[]","uint256[]"], payload);
                        payload = `Erc1155 Batch Transfer - Ids: ${decode[2]} Amounts: ${decode[3]} - Address: ${decode[1]}`;
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
                    case '0x6a627842': { 
                        //erc721 mint;
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
            input: n ? {index:n.input.index,payload: inputPayload} : {},
            proof: null,
            executed: null,
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
            <p>Voucher to execute</p>
        {voucherToExecute ? <table>
            <thead>
                <tr>
                    <th>Input Index</th>
                    <th>Voucher Index</th>
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
                        <th>Destination</th>
                        <th>Action</th>
                        {/* <th>Input Payload</th> */}
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
                            <td>{n.destination}</td>
                            <td>
                                <button onClick={() => getProof(n)}>Get Proof</button>
                            </td>
                            {/* <td>{n.input.payload}</td> */}
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
