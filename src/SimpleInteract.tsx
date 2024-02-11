import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import { Vouchers } from "./Vouchers";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import SendCurlRequestButton from './SendCurlRequestButton';


interface IInputField {
  name: string;
  value: string;
  description: string;
}


interface IInteract {
  dappAddress: string;
  contractAddress: string;
  setDappAddress?: (inputs: string) => void; // Callback for when inputs change
}

export const SimpleInteract: React.FC<IInteract> = ({ dappAddress, setDappAddress, contractAddress }) => {
  const [interactionInputsDappAddress, setInteractionInputsDappAddress] = useState<IInputField[]>([{ name: 'dappAddress', value: dappAddress, description: 'DApp Address' }]); // State to store the interaction inputs
  useEffect(() => {
    const dappAddressInput = interactionInputsDappAddress.find(input => input.name === 'dappAddress');
    if (dappAddressInput && setDappAddress) {
      setDappAddress(dappAddressInput.value);
    }
  }, [interactionInputsDappAddress, setDappAddress]);
  const [connectedWallet] = useWallets();
  const userAddress = connectedWallet?.accounts[0]?.address || '';

  return (
    <div>
      <h3>submit a prompt</h3>
      <InteractionForm
        description="Send Instruction"
        defaultInputs={[
          { name: 'prompt', value: "In old times when ", description: 'Prompt' },
          { name: 'llmSteps', value: "10", description: 'LLM Steps' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const uint256Value = ethers.BigNumber.from(inputObject2.value);
          return contract.sendInstructionPrompt(inputObject1.value, uint256Value);
        }}
      />
      <h3>post the response</h3>
      <div>
        <SendCurlRequestButton
          url="http://localhost:8545"
          data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
        />
      </div>
      <strong>Dapp Address</strong>: {dappAddress}
      <Vouchers dappAddress={dappAddress} />
      <h3>rank the responses</h3>
      <InteractionForm
        description="Get Conversation by ID"
        defaultInputs={[{ name: 'conversationId', value: "0", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const result = await contract.getConversationById(ethers.BigNumber.from(inputObject.value));
          return {
            author: result.author,
            prompt: result.prompt,
            responses: result.responses,
            rankSubmissionCount: result.rankSubmissionCount.toNumber(),
            usersWhoSubmittedRanks: result.usersWhoSubmittedRanks.map(ethers.utils.getAddress),
            createInstructionTimestamp: new Date(result.createInstructionTimestamp.toNumber() * 1000).toISOString(),
            responseAnnouncedTimestamp: new Date(result.responseAnnouncedTimestamp.toNumber() * 1000).toISOString()
          };
        }}
        isReadCall={true}
      />
      You prefer:
      <InteractionForm
        description="Submit Rank"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'ranks', value: "", description: 'Ranks (comma-separated) -- list the prefered responses first' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const ranksArray = inputObject2.value.split(',').map((rank: string) => ethers.BigNumber.from(rank.trim()));
          return contract.submitRank(conversationId, ranksArray);
        }}
      />
      <h3>List conversations (on-chain)</h3>
      <InteractionForm
        description="Get Conversation Count"
        defaultInputs={[]}
        contractFunction={async (signer: ethers.Signer) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getConversationCount().then((result: ethers.BigNumber) => result.toNumber());
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Get Conversation by ID"
        defaultInputs={[{ name: 'conversationId', value: "0", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const result = await contract.getConversationById(ethers.BigNumber.from(inputObject.value));
          return {
            author: result.author,
            prompt: result.prompt,
            responses: result.responses,
            rankSubmissionCount: result.rankSubmissionCount.toNumber(),
            usersWhoSubmittedRanks: result.usersWhoSubmittedRanks.map(ethers.utils.getAddress),
            createInstructionTimestamp: new Date(result.createInstructionTimestamp.toNumber() * 1000).toISOString(),
            responseAnnouncedTimestamp: new Date(result.responseAnnouncedTimestamp.toNumber() * 1000).toISOString()
          };
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Get Ranks By User"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'userAddress', value: userAddress, description: 'User Address' }
        ]}
        contractFunction={async (signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const userAddress = inputObject2.value;
          return contract.getRanksByUser(conversationId, userAddress).then((result: ethers.BigNumber[]) => result.map(rank => rank.toNumber()));
        }}
        isReadCall={true}
      />
      <h3>dump the dataset</h3>
      <button>dump the dataset</button>
      <h3>Other</h3>
    </div >
  );
};

