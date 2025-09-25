pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";

template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 75239746167205137733133750216066358321372310988397779618403076616989302862726;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
