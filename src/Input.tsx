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
import { ethers } from "ethers";
import { useRollups } from "./useRollups";
import { useWallets } from "@web3-onboard/react";
import { IERC1155__factory, IERC20__factory, IERC721__factory } from "./generated/rollups";

interface IInputPropos {
    dappAddress: string 
}

export const Input: React.FC<IInputPropos> = (propos) => {
    const rollups = useRollups(propos.dappAddress);
    const [connectedWallet] = useWallets();
    const provider = new ethers.providers.Web3Provider(
        connectedWallet.provider
    );

    const sendAddress = async (str: string) => {
        if (rollups) {
            try {
                await rollups.relayContract.relayDAppAddress(propos.dappAddress);
            } catch (e) {
                console.log(`${e}`);
            }
        }
    };

    const addInput = async (str: string) => {
        if (rollups) {
            try {
                let payload = ethers.utils.toUtf8Bytes(str);
                if (hexInput) {
                    payload = ethers.utils.arrayify(str);
                }
                await rollups.inputContract.addInput(propos.dappAddress, payload);
            } catch (e) {
                console.log(`${e}`);
            }
        }
    };

    const depositErc20ToPortal = async (token: string,amount: number) => {
        try {
            if (rollups && provider) {
                const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) of ERC20 (${token}).`);
                //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
                const signer = provider.getSigner();
                const signerAddress = await signer.getAddress()

                const erc20PortalAddress = rollups.erc20PortalContract.address;
                const tokenContract = signer ? IERC20__factory.connect(token, signer) : IERC20__factory.connect(token, provider);

                // query current allowance
                const currentAllowance = await tokenContract.allowance(signerAddress, erc20PortalAddress);
                if (ethers.utils.parseEther(`${amount}`) > currentAllowance) {
                    // Allow portal to withdraw `amount` tokens from signer
                    const tx = await tokenContract.approve(erc20PortalAddress, ethers.utils.parseEther(`${amount}`));
                    const receipt = await tx.wait(1);
                    const event = (await tokenContract.queryFilter(tokenContract.filters.Approval(), receipt.blockHash)).pop();
                    if (!event) {
                        throw Error(`could not approve ${amount} tokens for DAppERC20Portal(${erc20PortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`);
                    }
                }

                await rollups.erc20PortalContract.depositERC20Tokens(token,propos.dappAddress,ethers.utils.parseEther(`${amount}`),data);
            }
        } catch (e) {
            console.log(`${e}`);
        }
    };

    const depositEtherToPortal = async (amount: number) => {
        try {
            if (rollups && provider) {
                const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) ether.`);
                const txOverrides = {value: ethers.utils.parseEther(`${amount}`)}

                // const tx = await ...
                rollups.etherPortalContract.depositEther(propos.dappAddress,data,txOverrides);
            }
        } catch (e) {
            console.log(`${e}`);
        }
    };

    const transferNftToPortal = async (contractAddress: string,nftid: number) => {
        try {
            if (rollups && provider) {
                const data = ethers.utils.toUtf8Bytes(`Deposited (${nftid}) of ERC721 (${contractAddress}).`);
                //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
                const signer = provider.getSigner();
                const signerAddress = await signer.getAddress()

                const erc721PortalAddress = rollups.erc721PortalContract.address;

                const tokenContract = signer ? IERC721__factory.connect(contractAddress, signer) : IERC721__factory.connect(contractAddress, provider);

                // query current approval
                const currentApproval = await tokenContract.getApproved(nftid);
                if (currentApproval !== erc721PortalAddress) {
                    // Allow portal to withdraw `amount` tokens from signer
                    const tx = await tokenContract.approve(erc721PortalAddress, nftid);
                    const receipt = await tx.wait(1);
                    const event = (await tokenContract.queryFilter(tokenContract.filters.Approval(), receipt.blockHash)).pop();
                    if (!event) {
                        throw Error(`could not approve ${nftid} for DAppERC721Portal(${erc721PortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`);
                    }
                }

                // Transfer
                rollups.erc721PortalContract.depositERC721Token(contractAddress,propos.dappAddress, nftid, "0x", data);
            }
        } catch (e) {
            console.log(`${e}`);
        }
    };

    const transferErc1155SingleToPortal = async (contractAddress: string, id: number, amount: number) => {
        try {
            if (rollups && provider) {
                const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) tokens from id (${id}) of ERC1155 (${contractAddress}).`);
                //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
                const signer = provider.getSigner();
                const signerAddress = await signer.getAddress()

                const erc1155SinglePortalAddress = rollups.erc1155SinglePortalContract.address;

                const tokenContract = signer ? IERC1155__factory.connect(contractAddress, signer) : IERC1155__factory.connect(contractAddress, provider);

                // query current approval
                const currentApproval = await tokenContract.isApprovedForAll(signerAddress,erc1155SinglePortalAddress);
                if (!currentApproval) {
                    // Allow portal to withdraw `amount` tokens from signer
                    const tx = await tokenContract.setApprovalForAll(erc1155SinglePortalAddress,true);
                    const receipt = await tx.wait(1);
                    const event = (await tokenContract.queryFilter(tokenContract.filters.ApprovalForAll(), receipt.blockHash)).pop();
                    if (!event) {
                        throw Error(`could set approval for DAppERC1155Portal(${erc1155SinglePortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`);
                    }
                }

                // Transfer
                rollups.erc1155SinglePortalContract.depositSingleERC1155Token(contractAddress,propos.dappAddress, id, amount, "0x", data);
            }
        } catch (e) {
            console.log(`${e}`);
        }
    };

    const transferErc1155BatchToPortal = async (contractAddress: string, ids: number[], amounts: number[]) => {
        try {
            if (rollups && provider) {
                const data = ethers.utils.toUtf8Bytes(`Deposited (${amounts}) tokens from ids (${ids}) of ERC1155 (${contractAddress}).`);
                //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
                const signer = provider.getSigner();
                const signerAddress = await signer.getAddress()

                const erc1155BatchPortalAddress = rollups.erc1155BatchPortalContract.address;

                const tokenContract = signer ? IERC1155__factory.connect(contractAddress, signer) : IERC1155__factory.connect(contractAddress, provider);

                // query current approval
                const currentApproval = await tokenContract.isApprovedForAll(signerAddress,erc1155BatchPortalAddress);
                if (!currentApproval) {
                    // Allow portal to withdraw `amount` tokens from signer
                    const tx = await tokenContract.setApprovalForAll(erc1155BatchPortalAddress,true);
                    const receipt = await tx.wait(1);
                    const event = (await tokenContract.queryFilter(tokenContract.filters.ApprovalForAll(), receipt.blockHash)).pop();
                    if (!event) {
                        throw Error(`could set approval for DAppERC1155Portal(${erc1155BatchPortalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`);
                    }
                }

                // Transfer
                rollups.erc1155BatchPortalContract.depositBatchERC1155Token(contractAddress,propos.dappAddress, ids, amounts, "0x", data);
            }
        } catch (e) {
            console.log(`${e}`);
        }
    };

    const AddTo1155Batch = () => {
        const newIds = erc1155Ids;
        newIds.push(erc1155Id);
        setErc1155Ids(newIds);
        const newAmounts = erc1155Amounts;
        newAmounts.push(erc1155Amount);
        setErc1155Amounts(newAmounts);
        setErc1155IdsStr("["+erc1155Ids.join(',')+"]");
        setErc1155AmountsStr("["+erc1155Amounts.join(',')+"]");
    };

    const Clear1155Batch = () => {
        setErc1155IdsStr("[]");
        setErc1155AmountsStr("[]");
        setErc1155Ids([]);
        setErc1155Amounts([]);
    };
    
    const [input, setInput] = useState<string>("");
    const [hexInput, setHexInput] = useState<boolean>(false);
    const [erc20Amount, setErc20Amount] = useState<number>(0);
    const [erc20Token, setErc20Token] = useState<string>("");
    const [erc721Id, setErc721Id] = useState<number>(0);
    const [erc721, setErc721] = useState<string>("");
    const [etherAmount, setEtherAmount] = useState<number>(0);
    const [erc1155, setErc1155] = useState<string>("");
    const [erc1155Id, setErc1155Id] = useState<number>(0);
    const [erc1155Amount, setErc1155Amount] = useState<number>(0);
    const [erc1155Ids, setErc1155Ids] = useState<number[]>([]);
    const [erc1155Amounts, setErc1155Amounts] = useState<number[]>([]);
    const [erc1155IdsStr, setErc1155IdsStr] = useState<string>("[]");
    const [erc1155AmountsStr, setErc1155AmountsStr] = useState<string>("[]");

    return (
        <div>
            <div>
                Send Address (send relay dapp address) <br />
                <button onClick={() => sendAddress(input)} disabled={!rollups}>
                    Send
                </button>
                <br /><br />
            </div>
            <div>
                Send Input <br />
                Input: <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <input type="checkbox" checked={hexInput} onChange={(e) => setHexInput(!hexInput)}/><span>Raw Hex </span>
                <button onClick={() => addInput(input)} disabled={!rollups}>
                    Send
                </button>
                <br /><br />
            </div>
            <div>
                Deposit Ether <br />
                Amount: <input
                    type="number"
                    value={etherAmount}
                    onChange={(e) => setEtherAmount(Number(e.target.value))}
                />
                <button onClick={() => depositEtherToPortal(etherAmount)} disabled={!rollups}>
                    Deposit Ether
                </button>
                <br /><br />
            </div>
            <div>
                Deposit ERC20 <br />
                Address: <input
                    type="text"
                    value={erc20Token}
                    onChange={(e) => setErc20Token(e.target.value)}
                />
                Amount: <input
                    type="number"
                    value={erc20Amount}
                    onChange={(e) => setErc20Amount(Number(e.target.value))}
                />
                <button onClick={() => depositErc20ToPortal(erc20Token,erc20Amount)} disabled={!rollups}>
                    Deposit ERC20
                </button>
                <br /><br />
            </div>
            <div>
                Transfer ERC721 <br />
                Address: <input
                    type="text"
                    value={erc721}
                    onChange={(e) => setErc721(e.target.value)}
                />
                id: <input
                    type="number"
                    value={erc721Id}
                    onChange={(e) => setErc721Id(Number(e.target.value))}
                />
                <button onClick={() => transferNftToPortal(erc721,erc721Id)} disabled={!rollups}>
                    Transfer NFT
                </button>
                <br /><br />
            </div>
            <div>
                Transfer Single ERC1155 <br />
                Address: <input
                    type="text"
                    value={erc1155}
                    onChange={(e) => setErc1155(e.target.value)}
                />
                id: <input
                    type="number"
                    value={erc1155Id}
                    onChange={(e) => setErc1155Id(Number(e.target.value))}
                />
                Amount: <input
                    type="number"
                    value={erc1155Amount}
                    onChange={(e) => setErc1155Amount(Number(e.target.value))}
                />
                <button onClick={() => AddTo1155Batch()} disabled={!rollups}>
                    Add to Batch
                </button>
                <button onClick={() => transferErc1155SingleToPortal(erc1155,erc1155Id,erc1155Amount)} disabled={!rollups}>
                    Transfer Single 1155
                </button>
                <br />
                Transfer ERC1155 Batch <br />
                <span>Ids: {erc1155IdsStr} - Amounts: {erc1155AmountsStr}  </span>
                <button onClick={() => Clear1155Batch()} disabled={!rollups}>
                    Clear Batch
                </button>
                <button onClick={() => transferErc1155BatchToPortal(erc1155,erc1155Ids,erc1155Amounts)} disabled={!rollups}>
                    Transfer Batch 1155
                </button>
            </div>
        </div>
    );
};
