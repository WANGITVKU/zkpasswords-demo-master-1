pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";



template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 33810012004893417430140148864153794196460469779892178958286379591353717532617;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
