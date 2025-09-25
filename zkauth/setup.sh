#!/bin/bash
set -e

echo "Creating circuit.circom file..."
cat <<EOT > circuit.circom
pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";

template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 11411111097110;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
EOT

echo "Compiling the circuit..."
circom circuit.circom --r1cs --wasm --sym
echo "Circuit compiled."

echo "Exporting the R1CS to JSON..."
snarkjs r1cs export json circuit.r1cs circuit.r1cs.json
echo "R1CS exported to JSON."

echo "Creating input.json file..."
cat <<EOT > input.json
{"attempt": 1}
EOT
echo "input.json file created."

echo "Generating witness..."
cd circuit_js
node generate_witness.js circuit.wasm ../input.json ../witness.wtns
cd -
echo "Witness generated."

echo "Setting up Plonk proving system..."
snarkjs plonk setup circuit.r1cs pot14_final.ptau circuit_final.zkey
echo "Plonk proving system set up."

echo "Exporting verification key..."
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
echo "Verification key exported."

echo "Generating proof..."
snarkjs plonk prove circuit_final.zkey witness.wtns proof.json public.json
echo "Proof generated."

echo "Moving circuit.wasm back and cleaning up temp files..."
mv circuit_js/circuit.wasm .
rm -rf circuit_js
echo "Circuit WASM relocated."

echo "Cleaning up intermediates..."
rm -f circuit.r1cs circuit.r1cs.json public.json proof.json witness.wtns circuit.sym input.json
echo "Cleanup done."

exit 0