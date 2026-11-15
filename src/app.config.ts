export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/calendar/index',
    'pages/tasks/index',
    'pages/groups/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/create/index',
    'pages/detail/index',
    'pages/assets/index',
    'pages/stats/index',
    'pages/schedule/index',
    'pages/school/index',
    'pages/members/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f6f7f3',
    navigationBarTitleText: '新媒协同',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f6f7f3'
  },
  tabBar: {
    color: '#8a928d',
    selectedColor: '#173f35',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '工作台' },
      { pagePath: 'pages/calendar/index', text: '项目' },
      { pagePath: 'pages/tasks/index', text: '任务' },
      { pagePath: 'pages/groups/index', text: '群聊' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
})
