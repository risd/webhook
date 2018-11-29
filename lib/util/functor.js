module.exports = functor;

function functor ( value ) {
  return function () {
    return value;
  }
}
