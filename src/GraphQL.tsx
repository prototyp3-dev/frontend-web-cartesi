// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { useSetChain } from "@web3-onboard/react";
import React, { useMemo } from "react";
import { Client, createClient, Provider } from "urql";

import config from "./config.json";

const urls: Record<string, string> = {
    "0x7a69": "http://localhost:4000/graphql",
    "0x13881": "http://localhost:4000/graphql", // polygon
    "0x5": "http://localhost:4000/graphql", // goerli
    // "0x13881": "https://echo.polygon-mumbai.rollups.dev.cartesi.io/graphql",
};

const useGraphQL = () => {
    const [{ connectedChain }] = useSetChain();
    return useMemo<Client | null>(() => {
        if (!connectedChain) {
            return null;
        }
        let url = "";

        if(config.graphqlAPIURL !== "") {
            url = `${config.graphqlAPIURL}/graphql`;
            console.log("Using the provided API URL:", config.graphqlAPIURL);
        } else {
            url = urls[connectedChain.id];
        }

        if (!url) {
            return null;
        }

        return createClient({ url });
    }, [connectedChain]);
};

export const GraphQLProvider: any = (props: any) => {
    const client = useGraphQL();
    if (!client) {
        return <div />;
    }
    
    return <Provider value={client}>{props.children}</Provider>;
};

