import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";
import TrustAndTeachABI from "./contract_abi/TrustAndTeach.json";

interface InteractionForm {
  contractAddress: string;
  description: string;
  defaultInputString: string;
  contractFunction: (signer: ethers.Signer, ...args: any[]) => Promise<ethers.providers.TransactionResponse>;
}

export const InteractionForm: React.FC<InteractionForm> = ({ contractAddress, description, defaultInputString, contractFunction }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputString, setInputString] = useState<string>(defaultInputString);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, TrustAndTeachABI, signer); // Assuming TrustAndTeachABI is imported
        const tx = await contractFunction(signer, inputString); // Call the provided contract function
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
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="Enter your input"
        />
        <button type="submit" disabled={!provider}>{description}</button>
      </form>

      {transactionHash && (
        <p>Transaction sent! Hash: {transactionHash}</p>
      )}
    </div>
  );
};

