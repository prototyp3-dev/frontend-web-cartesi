import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import SendCurlRequestButton from './SendCurlRequestButton';


interface IInputField {
  name: string;
  value: string;
  description: string;
}


interface IInteract {
  contractAddress: string;
  hideInstructions: boolean;
}

export const Interact: React.FC<IInteract> = ({ contractAddress, hideInstructions }) => {
  const [connectedWallet] = useWallets();
  const userAddress = connectedWallet?.accounts[0]?.address || '';

  return (
    <div>
      <h3> Interact with Trust and Teach AI Contract</h3>
      {hideInstructions && <div style={{ color: 'blue' }}>
        This component breaks down the control of the trust and teach contract.
        When the response of the conversation is too long, the conversation is broken down into stings of length 512. These strings need to be posted one by one. Split Response Index indicates which part of the response we are working with. The simple interface does not support this spliting.
      </div>}
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
      <InteractionForm
        description="Announce Prompt Response"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'iResponse', value: "0", description: 'Response Index' },
          { name: 'iSplitResponse', value: "0", description: 'Split Response Index' },
          { name: 'splitResponse', value: "", description: 'Split Response' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField, inputObject3: IInputField, inputObject4: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const iResponse = ethers.BigNumber.from(inputObject2.value);
          const iSplitResponse = ethers.BigNumber.from(inputObject3.value);
          return contract.announcePromptResponse(conversationId, iResponse, iSplitResponse, inputObject4.value);
        }}
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
        description="Get Conversation Response Count"
        defaultInputs={[{ name: 'conversationId', value: "0", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getConversationResponseCount(ethers.BigNumber.from(inputObject.value)).then((result: ethers.BigNumber) => parseInt(result.toString()));
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Get Users Who Submitted Ranks"
        defaultInputs={[{ name: 'conversationId', value: "0", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getUsersWhoSubmittedRanks(ethers.BigNumber.from(inputObject.value));
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Get Prompt by Conversation ID"
        defaultInputs={[{ name: 'conversationId', value: "0", description: 'Conversation ID' }]}
        contractFunction={async (signer: ethers.Signer, inputObject: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getPromptByConversationId(ethers.BigNumber.from(inputObject.value));
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Submit Rank"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'ranks', value: "", description: 'Ranks (comma-separated)' }
        ]}
        contractFunction={(signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const ranksArray = inputObject2.value.split(',').map((rank: string) => ethers.BigNumber.from(rank.trim()));
          return contract.submitRank(conversationId, ranksArray);
        }}
      />
      <InteractionForm
        description="Get Conversation Response by Index"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'iResponse', value: "0", description: 'Response Index' },
          { name: 'iSplitResponse', value: "0", description: 'Split Response Index' }
        ]}
        contractFunction={async (signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField, inputObject3: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const iResponse = ethers.BigNumber.from(inputObject2.value);
          const iSplitResponse = ethers.BigNumber.from(inputObject3.value);
          return contract.getConversationResponseByIndex(conversationId, iResponse, iSplitResponse);
        }}
        isReadCall={true}
      />
      <InteractionForm
        description="Get Conversation Response Length"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'responseIndex', value: "0", description: 'Response Index' }
        ]}
        contractFunction={async (signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const responseIndex = ethers.BigNumber.from(inputObject2.value);
          return contract.getConversationResponseLength(conversationId, responseIndex).then((result: ethers.BigNumber) => result.toNumber());
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
        description="Get Rank By User At Index"
        defaultInputs={[
          { name: 'conversationId', value: "0", description: 'Conversation ID' },
          { name: 'userAddress', value: userAddress, description: 'User Address' },
          { name: 'index', value: "0", description: 'Rank Index' }
        ]}
        contractFunction={async (signer: ethers.Signer, inputObject1: IInputField, inputObject2: IInputField, inputObject3: IInputField) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const userAddress = inputObject2.value;
          const index = ethers.BigNumber.from(inputObject3.value);
          return contract.getRankByUserAtIndex(conversationId, userAddress, index).then((result: ethers.BigNumber) => result.toNumber());
        }}
        isReadCall={true}
      />
      <SendCurlRequestButton
        url="http://localhost:8545"
        data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
        buttonText="Advance Time"
      />
    </div >
  );
};

