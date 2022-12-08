// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { BigNumberish, ethers } from "ethers";
import React, { useEffect, useCallback } from "react";
import { useVouchersQuery, useVoucherQuery } from "./generated/graphql";
import { useRollups } from "./useRollups";
import { OutputValidityProofStruct } from "@cartesi/rollups/dist/src/types/contracts/interfaces/IOutput";

type Voucher = {
    id: string;
    index: number;
    destination: string;
    input: any, //{index: number; epoch: {index: number; }
    payload: string;
    proof: any;
    executed: any;
};

export const Vouchers: React.FC = () => {
    const [result,reexecuteQuery] = useVouchersQuery();
    const [voucherIdToFetch, setVoucherIdToFetch] = React.useState(String(null));
    const [voucherResult,reexecuteVoucherQuery] = useVoucherQuery({
        variables: { id: voucherIdToFetch }//, pause: !!voucherIdToFetch
    });
    const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
    const [executedVouchers, setExecutedVouchers] = React.useState<any>({});
    const { data, fetching, error } = result;
    const rollups = useRollups();

    const getProof = async (voucher: Voucher) => {
        setVoucherIdToFetch(voucher.id);
        reexecuteVoucherQuery({ requestPolicy: 'network-only' });
    };

    const reloadExecutedList = useCallback(() => {
        if (rollups) {
            const filter = rollups.outputContract.filters.VoucherExecuted();
            rollups.outputContract.queryFilter(filter).then( (d) => {
                const execs: any = {};
                for (const ev of d) {
                    execs[ev.args.voucherPosition._hex] = true;
                }
                setExecutedVouchers(execs);
            })
        }
    }, [rollups]);;

    React.useEffect(() => {
        if (!result.fetching) reloadExecutedList();
    }, [result, reloadExecutedList]);

    const executeVoucher = async (voucher: any) => {
        if (rollups && !!voucher.proof) {
            const proof: OutputValidityProofStruct = {
                ...voucher.proof,
                epochIndex: voucher.input.epoch.index,
                inputIndex: voucher.input.index,
                outputIndex: voucher.index,
            };

            const newVoucherToExecute = {...voucher};
            try {
                const tx = await rollups.outputContract.executeVoucher( voucher.destination,voucher.payload,proof);
                const receipt = await tx.wait();
                newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
                if (receipt.events) {
                    newVoucherToExecute.msg = `${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`;
                }
            } catch (e) {
                newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
            }
            setVoucherToExecute(newVoucherToExecute);
            reloadExecutedList();
        }
    }

    useEffect( () => {
        const getBitMaskPositionAndSetVoucher = async (voucher: any) => {
            if (rollups) {
                const bitMaskPosition: BigNumberish = 
                    await rollups.outputContract.getBitMaskPosition(voucher.input.epoch.index, voucher.input.index, voucher.index);
                if (executedVouchers[bitMaskPosition._hex]) {
                    voucher.executed = true;
                }
            }
            setVoucherToExecute(voucher);
        }
    
        if (!voucherResult.fetching && voucherResult.data){
            getBitMaskPositionAndSetVoucher(voucherResult.data.voucher);
        }
    },[voucherResult, rollups, executedVouchers]);

    if (fetching) return <p>Loading...</p>;
    if (error) return <p>Oh no... {error.message}</p>;

    if (!data || !data.vouchers) return <p>No vouchers</p>;

    const vouchers: Voucher[] = data.vouchers.nodes.map((n: any) => {
        let payload = n?.payload;
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
            input: n?.input || {epoch:{}},
            proof: null,
            executed: null,
        };
    }).sort((b: any, a: any) => {
        if (a.epoch === b.epoch) {
            if (a.input === b.input) {
                return a.voucher - b.voucher;
            } else {
                return a.input - b.input;
            }
        } else {
            return a.epoch - b.epoch;
        }
    });

    // const forceUpdate = useForceUpdate();
    return (
        <div>
            <p>Voucher to execute</p>
        {voucherToExecute ? <table>
            <thead>
                <tr>
                    <th>Epoch</th>
                    <th>Input Index</th>
                    <th>Voucher Index</th>
                    <th>Voucher Id</th>
                    <th>Destination</th>
                    <th>Action</th>
                    {/* <th>Payload</th> */}
                    {/* <th>Proof</th> */}
                    <th>Msg</th>
                </tr>
            </thead>
            <tbody>
                <tr key={`${voucherToExecute.input.epoch.index}-${voucherToExecute.input.index}-${voucherToExecute.index}`}>
                    <td>{voucherToExecute.input.epoch.index}</td>
                    <td>{voucherToExecute.input.index}</td>
                    <td>{voucherToExecute.index}</td>
                    <td>{voucherToExecute.id}</td>
                    <td>{voucherToExecute.destination}</td>
                    <td>
                        <button disabled={!voucherToExecute.proof || voucherToExecute.executed} onClick={() => executeVoucher(voucherToExecute)}>{voucherToExecute.proof ? (voucherToExecute.executed ? "Voucher executed" : "Execute voucher") : "No proof yet"}</button>
                    </td>
                    {/* <td>{voucherToExecute.payload}</td> */}
                    {/* <td>{voucherToExecute.proof}</td> */}
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
                        <th>Epoch</th>
                        <th>Input Index</th>
                        <th>Voucher Index</th>
                        <th>Voucher Id</th>
                        <th>Destination</th>
                        <th>Action</th>
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
                        <tr key={`${n.input.epoch.index}-${n.input.index}-${n.index}`}>
                            <td>{n.input.epoch.index}</td>
                            <td>{n.input.index}</td>
                            <td>{n.index}</td>
                            <td>{n.id}</td>
                            <td>{n.destination}</td>
                            <td>
                                <button onClick={() => getProof(n)}>Get Proof</button>
                            </td>
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
