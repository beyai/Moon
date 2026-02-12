module.exports = (api) => {
    api.cache(true)
    return {
        presets: [
            'module:@react-native/babel-preset'
        ],
        plugins: [
            [
                'module-resolver',
                {
                    root: './',
                    alias: {
                        'react-native-moon': './modules/react-native-moon'
                    }
                }
            ],
            [ 
                "react-native-unistyles/plugin", 
                { 
                    root: "src", 
                    debug: true 
                } 
            ],
            [
                "babel-plugin-root-import",
                {
                    "paths": [
                        {
                            "rootPathSuffix": "./src",
                            "rootPathPrefix": "@/"
                        }
                    ]
                }
            ],
            
            'react-native-worklets/plugin',
        ],
    };

}