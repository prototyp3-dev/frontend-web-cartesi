solc --abi --optimize --base-path . --include-path node_modules/ ../trust-and-teach-cartesi/contracts/src/localhost/trust-and-teach.sol -o src/contract_abi/
mv src/contract_abi/TrustAndTeach.abi src/contract_abi/TrustAndTeach.json
