export default {
  title: 'VA Automate',
  description: 'Documentation for Vehicle Authorization Automation',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Guide', link: '/guide/' },
      { text: 'Use cases', link: '/USE CASES/' },
      { text: 'Components', link: '/COMPONENTS/' },
      { text: 'GitHub', link: 'https://github.com/Certiman/automate-va' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Requirements', link: '/REQUIREMENTS' },
          { text: 'Technology', link: '/TECHNOLOGY' },
          { text: 'Storage', link: '/STORAGE' },
          { text: 'Linked process', link: '/COMPONENTS/process-task-step' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'App Core', link: '/COMPONENTS' },
          { text: 'Process Manager', link: '/COMPONENTS/process-manager' },
          { text: 'Process Connector', link: '/COMPONENTS/process-connector' },
          { text: 'Process Handler', link: '/COMPONENTS/process-handler' },
          { text: 'Process Sources', link: '/COMPONENTS/process-sources' },
        ],
      },
      // Add other sidebar sections
      {
        text: 'Registers',
        items: [
          { text: 'ERADIS', link: '/ERADIS',
            items: [
              { text: 'CLD', link: '/ERADIS/CERTIFICATES' },
              { text: 'EC Declarations', link: '/ERADIS/DECLARATIONS' },
              { text: 'Legal requirements', link: '/ERADIS/REQUIREMENTS' },
              { text: 'Conditions & Restrictions', link: '/ERADIS/RESTRICTION' },
            ]
           },
          { text: 'ERALEX', link: '/ERALEX' },
          {
            text: 'EVR',
            collapsed: false,
            items: [
              { text: 'Overview', link: '/EVR/' },
              { text: 'Registration Process', link: '/EVR/REGISTRATION' },
              {
                text: 'Vehicle Data Model',
                link: '/EVR/VEHICLES',
                items: [
                  {
                    text: 'Freight Wagons',
                    link: '/EVR/VEHICLES/Freight-Wagons',
                  },
                  { text: 'Locomotives', link: '/EVR/VEHICLES/traction' },
                  {
                    text: 'Passenger Wagons',
                    link: '/EVR/VEHICLES/hauled-passenger',
                  },
                  {
                    text: 'Special Wagons',
                    link: '/EVR/VEHICLES/special-vehicles',
                  },
                ],
              },
            ],
          },
          { text: 'Organisations', link: '/ORG' },
        ],
      },
    ],
  },
};
