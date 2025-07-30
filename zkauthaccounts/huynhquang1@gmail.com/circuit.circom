pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";



template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 107699727238586799419257528155958573945361216764786252771864849857623823692710;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
