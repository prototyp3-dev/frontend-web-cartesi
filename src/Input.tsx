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
import { IERC20__factory } from "./generated/rollups";


export const Input: React.FC = () => {
    const rollups = useRollups();
    const [connectedWallet] = useWallets();
    const provider = new ethers.providers.Web3Provider(
        connectedWallet.provider
    );

    const addInput = async (str: string) => {
        console.log(rollups);
        if (rollups) {
            rollups.inputContract.addInput(ethers.utils.toUtf8Bytes(str));
        }
    };
    const depositErc20ToPortal = async (token: string,amount: number) => {
        console.log(rollups);
        if (rollups) {
            const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) of ERC20 (${token}).`);
            //const data = `Deposited ${args.amount} tokens (${args.token}) for DAppERC20Portal(${portalAddress}) (signer: ${address})`;
            const signer = provider.getSigner();
            const signerAddress = await signer.getAddress()

            const portalAddress = rollups.erc20PortalContract.address;
            const tokenContract = signer ? IERC20__factory.connect(token, signer) : IERC20__factory.connect(token, provider) ;
            const signerBalance = await tokenContract.balanceOf(signerAddress);

            // query current allowance
            const currentAllowance = await tokenContract.allowance(signerAddress, portalAddress);
            if (signerBalance > currentAllowance) {
                // Allow bank to withdraw `amount` tokens from signer
                const tx = await tokenContract.approve(portalAddress, ethers.utils.parseEther(`${amount}`));
                const receipt = await tx.wait(1);
                const event = (await tokenContract.queryFilter(tokenContract.filters.Approval(), receipt.blockHash)).pop();
                if (!event) {
                    throw Error(`could not approve ${amount} tokens for DAppERC20Portal(${portalAddress})  (signer: ${signerAddress}, tx: ${tx.hash})`);
                }
            }

            rollups.erc20PortalContract.erc20Deposit(token,ethers.utils.parseEther(`${amount}`),data);
        }
    };
    const depositEtherToPortal = async (amount: number) => {
        if (rollups) {
            const data = ethers.utils.toUtf8Bytes(`Deposited (${amount}) ether.`);
            const txOverrides = {value: ethers.utils.parseEther(`${amount}`)}

            // const tx = await ...
            rollups.etherPortalContract.etherDeposit(data,txOverrides);
        }
    };

    const transferNftToPortal = async (contractAddress: string,nftid: number) => {
        if (rollups) {
            const receiverAddress = rollups.rollupsContract.address;

            const nftAbi = ["function safeTransferFrom( address from, address to, uint256 tokenId) external;"];

            // Get contract
            const nftContractReadonly = new ethers.Contract(contractAddress, nftAbi, provider);
            // Connecting with a signer allows you to use all the methods of the contract
            
            const nftContract = nftContractReadonly.connect(rollups.rollupsContract.signer);

            // Transfer
            nftContract.safeTransferFrom(await rollups.rollupsContract.signer.getAddress(), receiverAddress, nftid);
        }
    };
    const [input, setInput] = useState<string>("");
    const [erc20Amount, setErc20Amount] = useState<number>(0);
    const [erc20Token, setErc20Token] = useState<string>("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");
    const [erc721Id, setErc721Id] = useState<number>(0);
    const [erc721, setErc721] = useState<string>("");
    const [etherAmount, setEtherAmount] = useState<number>(0);

    return (
        <div>
            <div>
                Send Input <br />
                Input: <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
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
            </div>
        </div>
    );
};
