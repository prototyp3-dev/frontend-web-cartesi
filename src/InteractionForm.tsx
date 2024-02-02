import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";

interface IInteractionForm {
  contractAddress: string;
  description: string;
  defaultInputs: string[];
  contractFunction: (signer: ethers.Signer, ...args: any[]) => Promise<ethers.providers.TransactionResponse>;
}

export const InteractionForm: React.FC<IInteractionForm> = ({ contractAddress, description, defaultInputs, contractFunction }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputs, setInputs] = useState<string[]>(defaultInputs);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        const tx = await contractFunction(signer, ...inputs);
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
        {defaultInputs.map((input, index) => (
          <input
            key={index}
            type="text"
            value={inputs[index]}
            onChange={(e) => {
              const newInputs = [...inputs];
              newInputs[index] = e.target.value;
              setInputs(newInputs);
            }}
            placeholder={`Enter input #${index + 1}`}
          />
        ))}
        <button type="submit" disabled={!provider}>{description}</button>
      </form>
      {transactionHash && (
        <p>Transaction sent! Hash: {transactionHash}</p>
      )}
    </div>
  );
};

