pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";

template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 48311739799044587689509493908578382258494791763090173531371411066731418975446;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
