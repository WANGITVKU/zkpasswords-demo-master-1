pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";

template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 101904295986433679025385061057760266693704613619969028534502330464861053423335;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
