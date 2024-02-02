import React from 'react';
import { ethers } from 'ethers';
import { InteractionForm } from "./InteractionForm";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import SendCurlRequestButton from './SendCurlRequestButton';



interface IInteract {
  dappAddress: string;
  contractAddress: string;
}

export const Interact: React.FC<IInteract> = ({ dappAddress, contractAddress }) => {
  return (
    <div>
      through interaction form:
      <InteractionForm
        contractAddress={contractAddress}
        description="set dapp address"
        defaultInputs={[{ name: 'dappAddress', value: dappAddress, description: 'DApp Address' }]}
        contractFunction={(signer, inputObject) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.set_dapp_address(inputObject.value);
        }}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Send Instruction"
        defaultInputs={[
          { name: 'prompt', value: "In old times when ", description: 'Prompt' },
          { name: 'llmSteps', value: "10", description: 'LLM Steps' }
        ]}
        contractFunction={(signer, inputObject1, inputObject2) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const uint256Value = ethers.BigNumber.from(inputObject2.value);
          return contract.sendInstructionPrompt(inputObject1.value, uint256Value);
        }}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Announce Prompt Response"
        defaultInputs={[
          { name: 'conversationId', value: "", description: 'Conversation ID' },
          { name: 'iResponse', value: "", description: 'Response Index' },
          { name: 'iSplitResponse', value: "", description: 'Split Response Index' },
          { name: 'splitResponse', value: "", description: 'Split Response' }
        ]}
        contractFunction={(signer, inputObject1, inputObject2, inputObject3, inputObject4) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const conversationId = ethers.BigNumber.from(inputObject1.value);
          const iResponse = ethers.BigNumber.from(inputObject2.value);
          const iSplitResponse = ethers.BigNumber.from(inputObject3.value);
          return contract.announcePromptResponse(conversationId, iResponse, iSplitResponse, inputObject4.value);
        }}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Get Conversation by ID"
        defaultInputs={[{ name: 'conversationId', value: "", description: 'Conversation ID' }]}
        contractFunction={async (signer, inputObject) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getConversationById(ethers.BigNumber.from(inputObject.value));
        }}
        isReadCall={true}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Get Conversation Response Count"
        defaultInputs={[{ name: 'conversationId', value: "", description: 'Conversation ID' }]}
        contractFunction={async (signer, inputObject) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getConversationResponseCount(ethers.BigNumber.from(inputObject.value));
        }}
        isReadCall={true}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Get Prompt by Conversation ID"
        defaultInputs={[{ name: 'conversationId', value: "", description: 'Conversation ID' }]}
        contractFunction={async (signer, inputObject) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.getPromptByConversationId(ethers.BigNumber.from(inputObject.value));
        }}
        isReadCall={true}
      />
      <SendCurlRequestButton
        url="http://localhost:8545"
        data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
      />
    </div>
  );
};

