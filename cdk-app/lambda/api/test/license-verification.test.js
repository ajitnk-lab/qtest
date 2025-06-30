const { execSync } = require('child_process');
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire');

describe('q Pro License Verification', () => {
  let sandbox;
  let lambdaHandler;
  let execStub;
  let utilStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Create stubs for the exec function
    execStub = sandbox.stub();
    
    // Create a stub for util.promisify that returns our execStub
    utilStub = {
      promisify: sandbox.stub().returns(execStub)
    };
    
    // Use proxyquire to replace the dependencies with our stubs
    const lambda = proxyquire('../index', {
      'child_process': { exec: execStub },
      'util': utilStub
    });
    
    lambdaHandler = lambda.handler;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('verifyQProLicense function', () => {
    it('should return isInstalled: false when q is not installed', async () => {
      // Simulate q not being installed
      execStub.rejects(new Error('Command failed: which q\nq not found\n'));
      
      const event = {
        resource: '/license/verify',
        httpMethod: 'GET'
      };
      
      const result = await lambdaHandler(event, {});
      const body = JSON.parse(result.body);
      
      expect(result.statusCode).to.equal(200);
      expect(body.isInstalled).to.be.false;
      expect(body.isProLicenseActive).to.be.false;
      expect(body.message).to.include('Error checking q Pro license');
    });

    it('should detect a non-Pro license', async () => {
      // Simulate q being installed but with a non-Pro license
      execStub.onFirstCall().resolves({ stdout: '/usr/local/bin/q\n', stderr: '' });
      execStub.onSecondCall().resolves({ stdout: 'w2.8\n', stderr: '' });
      
      const event = {
        resource: '/license/verify',
        httpMethod: 'GET'
      };
      
      const result = await lambdaHandler(event, {});
      const body = JSON.parse(result.body);
      
      expect(result.statusCode).to.equal(200);
      expect(body.isInstalled).to.be.true;
      expect(body.isProLicenseActive).to.be.false;
      expect(body.message).to.equal('q Pro license is not active');
      expect(body.licenseInfo).to.equal('w2.8');
    });

    it('should detect a Pro license', async () => {
      // Simulate q being installed with a Pro license
      execStub.onFirstCall().resolves({ stdout: '/usr/local/bin/q\n', stderr: '' });
      execStub.onSecondCall().resolves({ stdout: 'p4.0\n', stderr: '' });
      
      const event = {
        resource: '/license/verify',
        httpMethod: 'GET'
      };
      
      const result = await lambdaHandler(event, {});
      const body = JSON.parse(result.body);
      
      expect(result.statusCode).to.equal(200);
      expect(body.isInstalled).to.be.true;
      expect(body.isProLicenseActive).to.be.true;
      expect(body.message).to.equal('q Pro license is active');
      expect(body.licenseInfo).to.equal('p4.0');
    });

    it('should handle errors when checking license status', async () => {
      // Simulate q being installed but error when checking license
      execStub.onFirstCall().resolves({ stdout: '/usr/local/bin/q\n', stderr: '' });
      execStub.onSecondCall().rejects(new Error('Command failed: q -c "0N!string[.z.l];exit 0"\nError: Invalid license\n'));
      
      const event = {
        resource: '/license/verify',
        httpMethod: 'GET'
      };
      
      const result = await lambdaHandler(event, {});
      const body = JSON.parse(result.body);
      
      expect(result.statusCode).to.equal(200);
      expect(body.isInstalled).to.be.true;
      expect(body.isProLicenseActive).to.be.false;
      expect(body.message).to.equal('Error checking q Pro license');
    });
  });
});