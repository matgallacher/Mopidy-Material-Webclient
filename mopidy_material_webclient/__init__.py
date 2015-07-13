from __future__ import unicode_literals


import logging
import os
import string
import json
import tornado.web

from configobj import ConfigObj, ConfigObjError
from validate import Validator
from wifi import Cell, Scheme
from mopidy import config, ext


__version__ = '0.1.0'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)
spec_file = os.path.join(os.path.dirname(__file__), 'settingsspec.ini')


class Extension(ext.Extension):

    dist_name = 'Mopidy-Material-Webclient'
    ext_name = 'material-webclient'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(Extension, self).get_config_schema()
        schema['config_file'] = config.String()
        return schema

    def setup(self, registry):
        registry.add(
            'http:app', {'name': self.ext_name, 'factory': self.factory})

    def factory(self, config, core):
        from tornado.web import StaticFileHandler
        path = os.path.join(os.path.dirname(__file__), 'static')
        return [
            (r'/wifi', WifiHandler),
            (r'/settings', SettingsHandler, {'core': core, 'config': config}),
            (r'/(.*)', StaticFileHandler, {'path': path, 'default_filename': 'index.html'})
        ]


#
#Get a list of wifi networks in range
#
class WifiHandler(tornado.web.RequestHandler): 

    def get(self):
        cells = Cell.all('wlan0')
        items = [];
        for cell in cells:
            items.append(cell.__dict__)

        self.write(json.dumps(items))


 # 
 #This section is entirely lifted from the brilliant https://github.com/woutervanwijk/mopidy-websettings 
 #updated to provide the settings as a RESTful json service
 #   
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
        response = json.dumps(templateVars)
        logger.info(response)
        self.write(response)

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
        message = '<html><body><h1>' + error + '</h1><p>Applying changes (reboot) <br/><a href="/">Back</a><br/></p></body></html>'
        self.write(message)

        #logger.info ("restart")
        #restart_program()

        #using two different methods for reboot for different systems
        logger.info('Rebooting system')
        os.system("sudo shutdown -r now")
        os.system("shutdown -r now")
