// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { FC, useState } from "react";
import injectedModule from "@web3-onboard/injected-wallets";
import { init } from "@web3-onboard/react";

import { GraphQLProvider } from "./GraphQL";
import { Notices } from "./Notices";
import { Interact } from "./Interact";
import { Input } from "./Input";
import { Inspect } from "./Inspect";
import { Network } from "./Network";
import { Vouchers } from "./Vouchers";
import { Reports } from "./Reports";
import configFile from "./config.json";

const config: any = configFile;

const injected: any = injectedModule();

init({
  wallets: [injected],
  chains: Object.entries(config).map(([k, v]: [string, any], i) => ({ id: k, token: v.token, label: v.label, rpcUrl: v.rpcUrl })),
  appMetadata: {
    name: "Cartesi Rollups Test DApp",
    icon: "<svg><svg/>",
    description: "Demo app for Cartesi Rollups",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});

const App: FC = () => {
  const [dappAddress, setDappAddress] = useState<string>("0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C");
  const [contractAddress, setContractAddress] = useState<string>("0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1");
  // const rpcUrl = config.ethereum.rpcUrl; // Assuming Ethereum configuration exists in your config file


  return (
    <div>
      <Network />
      <GraphQLProvider>
        <div>
          Contract Address: <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
          <br /><br />
        </div>
        <h1>submit a prompt</h1>
        <input type="text" value="enter your prompt" />
        <input type="text" value="10" />
        <button>submit</button>
        <h1>post the response</h1>
        <button>reload</button>
        <div>
          <button>post response 1</button>
          <button>post response 2</button>
        </div>
        <h1>rank the responses</h1>
        <button>show responses</button>
        You prefer:
        <div>
          <button>response 1</button>
          <button>response 2</button>
        </div>
        <h1>dump the dataset</h1>
        {/* <h2>Inspect</h2> */}
        {/* <Inspect /> */}
        <h2>Interact</h2>
        <Interact
          dappAddress={dappAddress}
          setDappAddress={setDappAddress}
          contractAddress={contractAddress}
        />
        {/* <h2>Input</h2> */}
        {/* <Input dappAddress={dappAddress} /> */}
        {/* <h2>Reports</h2> */}
        {/* <Reports /> */}
        <h2>Notices</h2>
        <Notices />
        <h2>Vouchers</h2>
        <strong>Dapp Address</strong>: {dappAddress}
        <Vouchers dappAddress={dappAddress} />
      </GraphQLProvider>
    </div>
  );
};

export default App;

