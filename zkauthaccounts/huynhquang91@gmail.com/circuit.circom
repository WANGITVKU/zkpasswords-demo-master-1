pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";



template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 47979501570776611915155295813191927682205574806297975375101892458173133995385;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
