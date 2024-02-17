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
import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { ethers } from 'ethers';

import { GraphQLProvider } from "./GraphQL";
import { Notices } from "./Notices";
import { Interact } from "./Interact";
import { SimpleInteract } from "./SimpleInteract";
import { InteractionForm } from "./InteractionForm";
import { Input } from "./Input";
// import { Inspect } from "./Inspect";
// import { Network } from "./Network";
import { Vouchers } from "./Vouchers";
import { Reports } from "./Reports";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import configFile from "./config.json";

const config: any = configFile;
const injected: any = injectedModule();

interface IInputField {
  name: string;
  value: string;
  description: string;
}


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
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [dappAddress, setDappAddress] = useState<string>("0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C");
  const [interactionInputsDappAddress, setInteractionInputsDappAddress] = useState<IInputField[]>([{ name: 'dappAddress', value: dappAddress, description: 'DApp Address' }]); // State to store the interaction inputs
  const [contractAddress, setContractAddress] = useState<string>("0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1");
  const [showInteract, setShowInteract] = useState<boolean>(false);
  const [hideInstructions, setHideInstructions] = useState(false);
  // const rpcUrl = config.ethereum.rpcUrl; // Assuming Ethereum configuration exists in your config file


  return (
    <div>
      <h1>Trust and Teach AI</h1>
      <h3>On-chain large language model (LLM) inference and response ranking for reinforcement learning with human feedback (RLHF)</h3>
      <p>This is a protocol to create a trusted and transparent RLHF dataset for DPO -- LLM runs deterministically in an optimistic roll-up Cartesi VM, the rankings are posted on-chain, and the rankers' addresses are also on-chain to leverege their reputation.</p>
      {/* <Network /> */}
      {!wallet && <button
        onClick={() =>
          connect()
        }
      >
        {connecting ? "connecting" : "connect"}
      </button>}
      <GraphQLProvider>
        <SimpleInteract
          dappAddress={dappAddress}
          setDappAddress={setDappAddress}
          contractAddress={contractAddress}
          hideInstructions={hideInstructions}
        />
        <div>
          <button onClick={() => setHideInstructions(!hideInstructions)}>{hideInstructions ? 'Hide Instructions' : 'Show Instructions'}</button>
        </div>
        <button onClick={() => setShowInteract(!showInteract)}>
          {showInteract ? 'Hide' : 'Show'} Advanced Interaction
        </button>
        <div>
        </div>
        {showInteract && (
          <>
            <h2>Advanced interaction with the contract</h2>
            {wallet && (
              <div>
                <label>Switch Chain</label>
                {settingChain ? (
                  <span>Switching chain...</span>
                ) : (
                  <select
                    onChange={({ target: { value } }) => {
                      if (config[value] !== undefined) {
                        setChain({ chainId: value })
                      } else {
                        alert("No deploy on this chain")
                      }
                    }
                    }
                    value={connectedChain?.id}
                  >
                    {chains.map(({ id, label }) => {
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
                <button onClick={() => disconnect(wallet)}>
                  Disconnect Wallet
                </button>
              </div>
            )}
            <h3>Setup</h3>
            Set up the Cartesi Rollup Contract DApp Address to allow the communication between Cartesi and the EVM chain.
            <InteractionForm
              description="set dapp address"
              defaultInputs={interactionInputsDappAddress}
              contractFunction={(signer: ethers.Signer, inputObject: IInputField) => {
                const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
                return contract.set_dapp_address(inputObject.value);
              }}
              onInputsChange={setInteractionInputsDappAddress} // Pass the callback to update the state when inputs change
            />
            {/* <h2>Inspect</h2> */}
            {/* <Inspect /> */}
            <Interact
              contractAddress={contractAddress}
              hideInstructions={hideInstructions}
            />
            <h2>Input</h2>
            <Input dappAddress={dappAddress} />
            <h2>Reports</h2>
            <Reports />
            <h2>Notices</h2>
            <Notices />
            <h2>Vouchers</h2>
            <strong>Dapp Address</strong>: {dappAddress}
            <Vouchers dappAddress={dappAddress} />
          </>
        )}
      </GraphQLProvider>
    </div>
  );
};

export default App;

