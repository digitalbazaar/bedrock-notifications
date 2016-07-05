var bedrock = global.bedrock;

var api = {};
module.exports = api;

var by = global.by;
var element = global.element;
var should = global.should;
var expect = global.expect;
var protractor = global.protractor;

api.EMAIL_ENABLED = 0;
api.EMAIL_DISABLED = 1;
api.EMAIL_INTERVAL_DAILY = 0;
api.EMAIL_INTERVAL_IMMEDIATE = 1;

api.emailCheckbox = function(index) {
  var checkboxElements =
    element(by.tagName('br-push-notification'))
    .all(by.brModel('model.settings[option.type].enable'));

  if(index === undefined) {
    return checkboxElements;
  }
  checkboxElements.get(index).click();
};

api.emailInterval = function(index) {
  var intervalElements =
    element(by.tagName('br-push-notification'))
    .all(by.brModel('model.settings[option.type].interval'));

  if(index === undefined) {
    return intervalElements;
  }
  intervalElements.get(index).click();
};

api.submit = function() {
  element(by.tagName('br-push-notification'))
    .element(by.attribute('ng-click', 'model.update()')).click();
};

api.checkFields = function() {
  var elements = [];
  elements.push(emailCheckbox());
  elements.push(emailInterval());
  elements.push(element(by.attribute('ng-click', '$ctrl.update()')));
  elements.push(element(by.attribute('ng-click', '$ctrl.cancel()')));
  for(var i in elements) {
    elements[i].isPresent().should.eventually.be.true;
  }
};
