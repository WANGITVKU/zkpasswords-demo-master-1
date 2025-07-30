pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";



template Main() {
    signal input attempt;
    signal output isEqual;

    var password = 104225205502723520562743533725157420670651613945358849108150622276267474988320;
    component eqChecker = IsEqual();
    attempt ==> eqChecker.in[0];
    password ==> eqChecker.in[1];

    eqChecker.out ==> isEqual;
}

component main = Main();
