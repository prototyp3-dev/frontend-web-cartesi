import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import { InteractionForm } from "./InteractionForm";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";
import SendCurlRequestButton from './SendCurlRequestButton';



interface Interact {
  dappAddress: string;
  contractAddress: string;
}

export const Interact: React.FC<Interact> = ({ dappAddress, contractAddress }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputString, setInputString] = useState<string>('');
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer); // Use the imported ABI
        const tx = await contract.sendInstructionPrompt(inputString);
        const receipt = await tx.wait();
        setTransactionHash(receipt.transactionHash);
        console.log('Transaction successful with hash:', receipt.transactionHash);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      through interaction form:
      <InteractionForm
        contractAddress={contractAddress}
        description="set dapp address"
        defaultInputString={dappAddress}
        contractFunction={(signer, inputString) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.set_dapp_address(inputString);
        }}
      />
      <InteractionForm
        contractAddress={contractAddress}
        description="Send Instruction"
        defaultInputString="When "
        contractFunction={(signer, inputString) => {
          const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer);
          return contract.sendInstructionPrompt(inputString);
        }}
      />
      <SendCurlRequestButton
        url="http://localhost:8545"
        data='{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[864010]}'
      />
    </div>
  );
};

