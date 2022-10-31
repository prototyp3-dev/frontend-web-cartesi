// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useSetChain, useWallets } from "@web3-onboard/react";

import {
    InputFacet,
    InputFacet__factory,
    OutputFacet,
    OutputFacet__factory,
    RollupsFacet,
    RollupsFacet__factory,
    ERC20PortalFacet,
    ERC20PortalFacet__factory,
    ERC721PortalFacet,
    ERC721PortalFacet__factory,
    EtherPortalFacet,
    EtherPortalFacet__factory,
} from "./generated/rollups";
import { ConnectedChain } from "@web3-onboard/core";

import configFile from "./config.json";

const config: any = configFile;

// const rollupsAddress: Record<string, any> = {
//     "0x7a69": "0xF119CC4Ed90379e5E0CC2e5Dd1c8F8750BAfC812", // local hardhat
//     "0x13881": "0xe219A4Ee9e1dFD132ED9F8e38B3519368cC9494F", // polygon_mumbai,
//     "0x5": "0xea055Bc7BC53A63E1C018Ceea5B6AddA75016064" // goerli,
// };

export interface RollupsContracts {
    rollupsContract: RollupsFacet;
    inputContract: InputFacet;
    outputContract: OutputFacet;
    erc20PortalContract: ERC20PortalFacet;
    erc721PortalContract: ERC721PortalFacet;
    etherPortalContract: EtherPortalFacet;
}

export const useRollups = (): RollupsContracts | undefined => {
    const [contracts, setContracts] = useState<RollupsContracts | undefined>();
    const [{ connectedChain }] = useSetChain();
    const [connectedWallet] = useWallets();

    useEffect(() => {
        const connect = async (
            chain: ConnectedChain
            ): Promise<RollupsContracts> => {
            const provider = new ethers.providers.Web3Provider(
                connectedWallet.provider
            );

            let address = "0x0000000000000000000000000000000000000000"; //zero addr as placeholder
            
            if(config[chain.id]?.rollupAddress) {
                address = config[chain.id].rollupAddress;
            } else {
                console.error(`No rollup address interface defined for chain ${chain.id}`);
                alert(`No rollup address interface defined for chain ${chain.id}`);
            }

                
            // rollups contract
            const rollupsContract = RollupsFacet__factory.connect(
                address,
                provider.getSigner()
            );

            // input contract
            const inputContract = InputFacet__factory.connect(
                address,
                provider.getSigner()
            );
            
            const outputContract = OutputFacet__factory.connect(
                address,
                provider.getSigner()
            );

            // const Web3 = require("web3");
            // const web3 = new Web3(new Web3.providers.WebsocketProvider("http://localhost:8545"))
            // const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

            // output contract
            const erc20PortalContract = ERC20PortalFacet__factory.connect(
                address,
                provider.getSigner()
            );

            const erc721PortalContract = ERC721PortalFacet__factory.connect(
                address,
                provider.getSigner()
            );

            const etherPortalContract = EtherPortalFacet__factory.connect(
                address,
                provider.getSigner()
            );

            return {
                rollupsContract,
                inputContract,
                outputContract,
                erc20PortalContract,
                erc721PortalContract,
                etherPortalContract,
            };
        };
        if (connectedWallet?.provider && connectedChain) {
            connect(connectedChain).then((contracts) => {
                setContracts(contracts);
            });
        }
    }, [connectedWallet, connectedChain]);
    return contracts;
};
