describe("mailcheck", function() {
  var domains = ['yahoo.com', 'yahoo.com.tw', 'google.com','hotmail.com', 'gmail.com', 'emaildomain.com', 'comcast.net', 'facebook.com', 'msn.com', 'gmx.com'];

  describe("jquery.mailcheck", function () {
    var suggestedSpy, emptySpy;

    beforeEach(function() {
      $('body').append('<div id="playground"></div>');

      suggestedSpy = jasmine.createSpy();
      emptySpy = jasmine.createSpy();

      $('#playground').append('<input type="text" id="test-input"/>');
    });

    afterEach(function() {
      $('#playground').remove();
    });

    it("calls the 'suggested' callback with the element and result when there's a suggestion", function () {
      $("#test-input").val('test@hotmail.co').mailcheck({
        suggested: suggestedSpy,
        empty: emptySpy
      });

      expect(suggestedSpy).toHaveBeenCalledWith($("#test-input"),{
        address: 'test',
        domain: 'hotmail.com',
        full: 'test@hotmail.com'
      });

      expect(emptySpy).not.toHaveBeenCalled();
    });

    it("calls the 'empty' callback with the element when there's no suggestion", function () {
      $("#test-input").val('contact@kicksend.com').mailcheck({
        suggested: suggestedSpy,
        empty: emptySpy
      });

      expect(suggestedSpy).not.toHaveBeenCalled();

      expect(emptySpy).toHaveBeenCalledWith($("#test-input"));
    });

    it("takes in an array of specified domains", function() {
      $("#test-input").val('test@emaildomain.con').mailcheck({
        suggested: suggestedSpy,
        empty: emptySpy,
        domains: domains
      });

      expect(suggestedSpy).toHaveBeenCalledWith($("#test-input"), {
        address: 'test',
        domain: 'emaildomain.com',
        full: 'test@emaildomain.com'
      });
    });

    it("escapes the element's value", function() {
      $("#test-input").val('<script>alert("a")</script>@emaildomain.con').mailcheck({
        suggested:suggestedSpy,
        empty:emptySpy,
        domains:domains
      });
      expect(suggestedSpy.mostRecentCall.args[1].address).not.toMatch(/<script>/);
    });

    describe("backwards compatibility", function () {
      it("takes in the same method signature as the first version", function () {
        $("#test-input").val('test@emaildomain.con').mailcheck(domains, {
          suggested: suggestedSpy,
          empty: emptySpy
        });

        expect(suggestedSpy).toHaveBeenCalledWith($("#test-input"), {
          address: 'test',
          domain: 'emaildomain.com',
          full: 'test@emaildomain.com'
        });
      });
    });
  });

  describe("Kicksend.mailcheck", function(){
    var mailcheck;

    beforeEach(function(){
       mailcheck = Kicksend.mailcheck;
    });

    describe("return value", function () {
      it("is a hash representing the email address", function () {
        var result = mailcheck.suggest('test@hotmail.co', domains);

        expect(result).toEqual({
          address: 'test',
          domain: 'hotmail.com',
          full: 'test@hotmail.com'
        });
      });

      it("is false when no suggestion is found", function() {
        expect(mailcheck.suggest('contact@kicksend.com', domains)).toBeFalsy();
      });

      it("is false when an incomplete email is provided", function(){
        expect(mailcheck.suggest('contact', domains)).toBeFalsy();
      });
    });

    describe("cases", function () {
      it("pass", function () {
        expect(mailcheck.suggest('test@emaildomain.co', domains).domain).toEqual('emaildomain.com');
        expect(mailcheck.suggest('test@gmail.con', domains).domain).toEqual('gmail.com');
        expect(mailcheck.suggest('test@gnail.con', domains).domain).toEqual('gmail.com');
        expect(mailcheck.suggest('test@GNAIL.con', domains).domain).toEqual('gmail.com');
        expect(mailcheck.suggest('test@#gmail.com', domains).domain).toEqual('gmail.com');
        expect(mailcheck.suggest('test@comcast.com', domains).domain).toEqual('comcast.net');
        expect(mailcheck.suggest('test@homail.con', domains).domain).toEqual('hotmail.com');
        expect(mailcheck.suggest('test@hotmail.co', domains).domain).toEqual('hotmail.com');
        expect(mailcheck.suggest('test@fabecook.com', domains).domain).toEqual('facebook.com');
        expect(mailcheck.suggest('test@yajoo.com', domains).domain).toEqual('yahoo.com');
        expect(mailcheck.suggest('test@yahoo.com.tw', domains)).toBeFalsy();
        expect(mailcheck.suggest('', domains)).toBeFalsy();
        expect(mailcheck.suggest('test@', domains)).toBeFalsy();
        expect(mailcheck.suggest('test', domains)).toBeFalsy();
      });
    });

    describe("mailcheck.splitEmail", function () {
      it("returns a hash of the address and the domain", function () {
        expect(mailcheck.splitEmail('test@example.com')).toEqual({
          address:'test',
          domain:'example.com'
        });
      });

      it("splits RFC compliant emails", function () {
        expect(mailcheck.splitEmail('"foo@bar"@example.com')).toEqual({
          address:'"foo@bar"',
          domain:'example.com'
        });   
        expect(mailcheck.splitEmail('containsnumbers1234567890@example.com')).toEqual({
          address:'containsnumbers1234567890',
          domain:'example.com'
        });        
        expect(mailcheck.splitEmail('contains+symbol@example.com')).toEqual({
          address:'contains+symbol',
          domain:'example.com'
        });    
        expect(mailcheck.splitEmail('contains-symbol@example.com')).toEqual({
          address:'contains-symbol',
          domain:'example.com'
        });      
        expect(mailcheck.splitEmail('contains.symbol@domain.contains.symbol')).toEqual({
          address:'contains.symbol',
          domain:'domain.contains.symbol'
        });
        expect(mailcheck.splitEmail('"contains.and\ symbols"@example.com')).toEqual({
          address:'"contains.and\ symbols"',
          domain:'example.com'
        });        
        expect(mailcheck.splitEmail('"contains.and.@.symbols.com"@example.com')).toEqual({
          address:'"contains.and.@.symbols.com"',
          domain:'example.com'
        });       
        expect(mailcheck.splitEmail('"()<>[]:;@,\\\"!#$%&\'*+-/=?^_`{}|\ \ \ \ \ ~\ \ \ \ \ \ \ ?\ \ \ \ \ \ \ \ \ \ \ \ ^_`{}|~.a"@allthesymbols.com')).toEqual({
          address:'"()<>[]:;@,\\\"!#$%&\'*+-/=?^_`{}|\ \ \ \ \ ~\ \ \ \ \ \ \ ?\ \ \ \ \ \ \ \ \ \ \ \ ^_`{}|~.a"',
          domain:'allthesymbols.com'
        });
        expect(mailcheck.splitEmail('postbox@com')).toEqual({
          address:'postbox',
          domain:'com'
        });
      });
      
      it("returns false for email addresses that are not RFC compliant", function () {
        expect(mailcheck.splitEmail('example.com')).toBeFalsy();
        expect(mailcheck.splitEmail('abc.example.com')).toBeFalsy();
        expect(mailcheck.splitEmail('@example.com')).toBeFalsy();
        expect(mailcheck.splitEmail('test@')).toBeFalsy();
      });
    });

    describe("mailcheck.findClosestDomain", function () {
      it("returns the most similar domain", function () {
        expect(mailcheck.findClosestDomain('gms.com', domains)).toEqual('gmx.com');
        expect(mailcheck.findClosestDomain('gmsn.com', domains)).toEqual('msn.com');
      });
    });
  });
});
