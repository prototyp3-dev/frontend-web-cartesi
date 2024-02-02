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
        contractFunction={(signer, inputString) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.set_dapp_address(inputString);
        }}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Send Instruction"
        defaultInputs={[
          { name: 'prompt', value: "In old times when ", description: 'Prompt' },
          { name: 'llmSteps', value: "3", description: 'LLM Steps' }
        ]}
        contractFunction={(signer, inputString, inputUint256) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          const uint256Value = ethers.BigNumber.from(inputUint256);
          return contract.sendInstructionPrompt(inputString, uint256Value);
        }}
      />
      <SendCurlRequestButton
        url="http://localhost:8545"
        data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
      />
    </div>
  );
};

