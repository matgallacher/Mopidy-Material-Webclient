from __future__ import unicode_literals

import logging
import string
import json

import tornado.web

from . import Extension

logger = logging.getLogger(__name__)


class StaticHandler(tornado.web.StaticFileHandler):

    def get(self, path, *args, **kwargs):
        version = self.get_argument('v', None)
        if version:
            logger.debug('Get static resource for %s?v=%s', path, version)
        else:
            logger.debug('Get static resource for %s', path)
        return super(StaticHandler, self).get(path, *args, **kwargs)

    @classmethod
    def get_version(cls, settings, path):
        return Extension.version

    
class SettingsHandler(tornado.web.RequestHandler):

    def initialize(self, core, config):
        self.config_file = config.get('websettings')['config_file']
        self.core = core

    def get(self):
        error = ''
        #read config file
        try:
            iniconfig = ConfigObj(self.config_file, configspec=spec_file, file_error=True, encoding='utf8')
        except (ConfigObjError, IOError), e:
            error = 'Could not load ini file! %s %s %s' % (e, ConfigObjError, IOError)
        #read values of valid items (in the spec-file)
        validItems = ConfigObj(spec_file, encoding='utf8')
        templateVars = {
            "error": error
        }
        #iterate over the valid items to get them into the template
        for item in validItems:
            for subitem in validItems[item]:
                itemName = item + '__' + subitem
                try:
                    configValue = iniconfig[item][subitem]
                    #compare last 8 caracters of subitemname
                    if subitem[-8:] == 'password' and configValue != '':
                        configValue = password_mask * len(iniconfig[item][subitem])
                    templateVars[itemName] = configValue
                except:
                    pass

        self.write(json.dumps(templateVars))

    def post(self):
        error = ''
        try:
            iniconfig = ConfigObj(self.config_file, configspec=spec_file, file_error=True, encoding='utf8')
        except (ConfigObjError, IOError), e:
            error = 'Could not load ini file!'
        if error == '':
            validItems = ConfigObj(spec_file, encoding='utf8')
            templateVars = {
                "error": error
            }
            #iterate over the items, so that only valid items are processed
            for item in validItems:
                for subitem in validItems[ item ]:
                    itemName = item + '__' + subitem
                    argumentItem = self.get_argument(itemName, default='')
                    if argumentItem:
                        #don't edit config value if password mask
                        if subitem[-8:] == 'password':
                          if argumentItem == (password_mask * len(argumentItem)) or argumentItem == '':
                              continue
                        #create section entry if it doesn't exist
                        try:
                            iniconfig[item][subitem] = argumentItem
                        except:
                            iniconfig[item] = {}
                            iniconfig[item][subitem] = argumentItem
            iniconfig.write()
            error = 'Settings Saved!'
        message = '<html><body><h1>' + error + '</h1><p>Applying changes (reboot) <br/><a href="/">Back</a><br/></p></body></html>'
        self.write(message)

        #logger.info ("restart")
        #restart_program()

        #using two different methods for reboot for different systems
        logger.info('Rebooting system')
        os.system("sudo shutdown -r now")
        os.system("shutdown -r now")
