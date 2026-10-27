/*
 * 雅思学习题库（网页版与小程序版共用的唯一数据源）
 * UMD 格式：浏览器 <script> 挂到 window.IELTS_DATA；Node/小程序走 module.exports
 * 同步规则：本文件为 canonical，小程序 utils/data.js 为副本，改动后需重新拷贝
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.IELTS_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ============ 一、核心词汇 8 类 × 15 = 120 词 ============ */
  var WORD_CATS = [
    { id: 'edu', name: '教育', en: 'Education' },
    { id: 'env', name: '环境', en: 'Environment' },
    { id: 'tech', name: '科技', en: 'Technology' },
    { id: 'work', name: '工作商业', en: 'Work & Business' },
    { id: 'health', name: '健康', en: 'Health' },
    { id: 'society', name: '社会城市', en: 'Society' },
    { id: 'media', name: '媒体艺术', en: 'Media & Art' },
    { id: 'academic', name: '学术写作', en: 'Academic Writing' }
  ];

  // [单词, 音标, 词性, 中文, 英文例句, 例句中译]
  var W = function (cat, w, ph, pos, cn, ex, exCn) {
  return { cat: cat, w: w, ph: ph, pos: pos, cn: cn, ex: ex, exCn: exCn };
  };

  var WORDS = [
    W('edu', 'curriculum', '/kəˈrɪkjələm/', 'n.', '课程体系', 'The school recently revised its curriculum to include more coding classes.', '该校最近修订了课程体系，加入了更多编程课。'),
    W('edu', 'pedagogy', '/ˈpedəɡɒdʒi/', 'n.', '教学法', 'Her pedagogy emphasises group discussion over rote memorisation.', '她的教学法强调小组讨论，而非死记硬背。'),
    W('edu', 'vocational', '/vəʊˈkeɪʃənl/', 'adj.', '职业的；职业技能的', 'Vocational training prepares students for trades such as plumbing.', '职业培训为学生从事水管工等行当做准备。'),
    W('edu', 'literacy', '/ˈlɪtərəsi/', 'n.', '读写能力；素养', 'Media literacy helps teenagers evaluate information online.', '媒介素养帮助青少年甄别网络信息。'),
    W('edu', 'tuition', '/tjuˈɪʃn/', 'n.', '学费；讲授', 'University tuition has risen sharply over the past decade.', '过去十年大学学费大幅上涨。'),
    W('edu', 'scholarship', '/ˈskɒləʃɪp/', 'n.', '奖学金', 'She won a scholarship to study engineering in Canada.', '她获得了去加拿大读工程的奖学金。'),
    W('edu', 'faculty', '/ˈfæklti/', 'n.', '全体教员；能力', 'The faculty voted to extend the submission deadline.', '全体教员投票决定延长提交截止日期。'),
    W('edu', 'syllabus', '/ˈsɪləbəs/', 'n.', '教学大纲', 'Two novels were removed from this year’s syllabus.', '今年的教学大纲删掉了两部小说。'),
    W('edu', 'plagiarism', '/ˈpleɪdʒərɪzəm/', 'n.', '剽窃；抄袭', 'Students caught committing plagiarism may fail the course.', '被发现抄袭的学生可能挂科。'),
    W('edu', 'enrol', '/ɪnˈrəʊl/', 'v.', '注册；入学', 'More mature students are enrolling in online degrees.', '越来越多的成年学生注册在线学位课程。'),
    W('edu', 'dissertation', '/ˌdɪsəˈteɪʃn/', 'n.', '学位论文', 'She spent the summer writing up her dissertation.', '她整个夏天都在撰写学位论文。'),
    W('edu', 'compulsory', '/kəmˈpʌlsəri/', 'adj.', '必修的；义务的', 'English is a compulsory subject from primary school.', '英语从小学起就是必修科目。'),
    W('edu', 'seminar', '/ˈsemɪnɑː/', 'n.', '研讨课；研讨会', 'The professor leads a weekly seminar on modern history.', '教授每周主持一次现代史研讨课。'),
    W('edu', 'discipline', '/ˈdɪsəplɪn/', 'n.', '学科；纪律', 'Economics is a relatively young academic discipline.', '经济学是一门相对年轻的学科。'),
    W('edu', 'undergraduate', '/ˌʌndəˈɡrædʒuət/', 'n./adj.', '本科生（的）', 'Undergraduate applications have risen by a fifth.', '本科申请人数增加了五分之一。'),

    W('env', 'sustainable', '/səˈsteɪnəbl/', 'adj.', '可持续的', 'Cities need sustainable transport systems to cut emissions.', '城市需要可持续的交通系统来减排。'),
    W('env', 'emission', '/ɪˈmɪʃn/', 'n.', '排放（物）', 'New regulations aim to reduce industrial carbon emissions.', '新法规旨在减少工业碳排放。'),
    W('env', 'biodiversity', '/ˌbaɪəʊdaɪˈvɜːsəti/', 'n.', '生物多样性', 'The reef supports one of the richest areas of biodiversity on Earth.', '这片珊瑚礁是地球上生物多样性最丰富的区域之一。'),
    W('env', 'contamination', '/kənˌtæmɪˈneɪʃn/', 'n.', '污染；玷污', 'Water contamination was traced to a leaking fuel tank.', '水污染被溯源到一个泄漏的油箱。'),
    W('env', 'renewable', '/rɪˈnjuːəbl/', 'adj.', '可再生的', 'Over half the country’s electricity now comes from renewable sources.', '该国一半以上的电力来自可再生能源。'),
    W('env', 'deforestation', '/ˌdiːˌfɒrɪˈsteɪʃn/', 'n.', '森林砍伐', 'Deforestation is driving many species towards extinction.', '森林砍伐正把许多物种推向灭绝。'),
    W('env', 'ecosystem', '/ˈiːkəʊsɪstəm/', 'n.', '生态系统', 'A single invasive species can disrupt an entire ecosystem.', '一个入侵物种就能扰乱整个生态系统。'),
    W('env', 'conservation', '/ˌkɒnsəˈveɪʃn/', 'n.', '保护；保存', 'The charity funds conservation projects in the wetlands.', '该慈善机构资助湿地保护项目。'),
    W('env', 'pollutant', '/pəˈluːtənt/', 'n.', '污染物', 'Vehicles are the main source of this pollutant in cities.', '车辆是城市中这种污染物的主要来源。'),
    W('env', 'scarcity', '/ˈskeəsəti/', 'n.', '短缺；稀缺', 'Water scarcity may force farms to change their crops.', '水资源短缺可能迫使农场改种作物。'),
    W('env', 'habitat', '/ˈhæbɪtæt/', 'n.', '栖息地', 'Wetlands provide a vital habitat for migrating birds.', '湿地为候鸟提供了重要的栖息地。'),
    W('env', 'extinction', '/ɪkˈstɪŋkʃn/', 'n.', '灭绝', 'Habitat loss is pushing many frogs towards extinction.', '栖息地丧失正把许多蛙类推向灭绝。'),
    W('env', 'carbon', '/ˈkɑːbən/', 'n.', '碳', 'The airline lets passengers offset their carbon emissions.', '这家航空公司允许乘客抵消自己的碳排放。'),
    W('env', 'pesticide', '/ˈpestɪsaɪd/', 'n.', '农药；杀虫剂', 'Farmers are encouraged to reduce pesticide use.', '农民被鼓励减少农药使用。'),
    W('env', 'landfill', '/ˈlændfɪl/', 'n.', '垃圾填埋场', 'Most plastic packaging ends up in landfill.', '大多数塑料包装最终被送进填埋场。'),

    W('tech', 'innovation', '/ˌɪnəˈveɪʃn/', 'n.', '创新', 'The region’s economic success rests on constant innovation.', '该地区的经济成功依靠持续创新。'),
    W('tech', 'automation', '/ˌɔːtəˈmeɪʃn/', 'n.', '自动化', 'Automation has eliminated many routine factory jobs.', '自动化已经消灭了许多重复性的工厂岗位。'),
    W('tech', 'surveillance', '/sɜːˈveɪləns/', 'n.', '监控', 'Critics argue the cameras amount to mass surveillance.', '批评者认为这些摄像头等同于大规模监控。'),
    W('tech', 'obsolete', '/ˈɒbsəliːt/', 'adj.', '过时的；淘汰的', 'The technology became obsolete within five years.', '这项技术不到五年就被淘汰了。'),
    W('tech', 'breakthrough', '/ˈbreɪkθruː/', 'n.', '突破', 'Scientists announced a breakthrough in battery design.', '科学家宣布在电池设计上取得突破。'),
    W('tech', 'algorithm', '/ˈælɡərɪðəm/', 'n.', '算法', 'The algorithm recommends videos based on viewing history.', '该算法根据观看历史推荐视频。'),
    W('tech', 'device', '/dɪˈvaɪs/', 'n.', '设备；装置', 'Patients wear a small device that monitors their heart rate.', '患者佩戴一个监测心率的小型设备。'),
    W('tech', 'accessible', '/əkˈsesəbl/', 'adj.', '易获取的；易使用的', 'Online courses make education accessible to remote communities.', '在线课程让偏远社区也能获得教育。'),
    W('tech', 'manual', '/ˈmænjuəl/', 'adj./n.', '手工的；手册', 'Repetitive manual work is increasingly done by machines.', '重复性体力劳动越来越多地由机器完成。'),
    W('tech', 'privacy', '/ˈprɪvəsi/', 'n.', '隐私', 'New laws give users more control over their online privacy.', '新法律让用户对自己的网络隐私有更多控制权。'),
    W('tech', 'artificial', '/ˌɑːtɪˈfɪʃl/', 'adj.', '人工的；人造的', 'Artificial sweeteners are used in many diet drinks.', '许多无糖饮料使用人工甜味剂。'),
    W('tech', 'database', '/ˈdeɪtəbeɪs/', 'n.', '数据库', 'The hospital keeps patient records in a secure database.', '医院把病历保存在安全的数据库里。'),
    W('tech', 'virtual', '/ˈvɜːtʃuəl/', 'adj.', '虚拟的；实质上的', 'The museum offers a virtual tour of its galleries.', '这家博物馆提供展厅的虚拟导览。'),
    W('tech', 'upgrade', '/ˌʌpˈɡreɪd/', 'v./n.', '升级；改进', 'The school upgraded its computer lab last year.', '学校去年升级了计算机实验室。'),
    W('tech', 'cybersecurity', '/ˌsaɪbəsɪˈkjʊərəti/', 'n.', '网络安全', 'Banks invest heavily in cybersecurity to protect customer data.', '银行在网络安全上投入巨资以保护客户数据。'),

    W('work', 'negotiate', '/nɪˈɡəʊʃieɪt/', 'v.', '谈判；协商', 'Workers negotiated a four per cent pay rise.', '工人们通过谈判争取到了 4% 的加薪。'),
    W('work', 'revenue', '/ˈrevənjuː/', 'n.', '收入；营收', 'Advertising revenue fell as readers moved online.', '随着读者转向线上，广告收入下滑了。'),
    W('work', 'entrepreneur', '/ˌɒntrəprəˈnɜː/', 'n.', '企业家', 'The programme lends money to young entrepreneurs.', '该项目向年轻企业家提供贷款。'),
    W('work', 'redundant', '/rɪˈdʌndənt/', 'adj.', '被裁员的；多余的', 'Two hundred staff were made redundant last quarter.', '上季度有 200 名员工被裁员。'),
    W('work', 'incentive', '/ɪnˈsentɪv/', 'n.', '激励；刺激', 'Tax breaks are used as an incentive to save energy.', '税收减免被用作节能激励手段。'),
    W('work', 'productivity', '/ˌprɒdʌkˈtɪvəti/', 'n.', '生产力；效率', 'Short naps were found to boost afternoon productivity.', '研究发现小睡片刻能提升下午的工作效率。'),
    W('work', 'vacancy', '/ˈveɪkənsi/', 'n.', '职位空缺', 'The hospital has three vacancies for nurses.', '这家医院有三个护士岗位空缺。'),
    W('work', 'freelance', '/ˈfriːlɑːns/', 'adj./v.', '自由职业的；从事自由职业', 'He works freelance from home as a translator.', '他在家做自由笔译。'),
    W('work', 'promote', '/prəˈməʊt/', 'v.', '促进；晋升', 'Regular exercise promotes both physical and mental health.', '经常锻炼能促进身心健康。'),
    W('work', 'commute', '/kəˈmjuːt/', 'v./n.', '通勤', 'Many workers commute over two hours each day.', '许多上班族每天通勤超过两小时。'),
    W('work', 'candidate', '/ˈkændɪdət/', 'n.', '候选人；求职者', 'Fifty candidates applied for the teaching post.', '有五十名求职者申请这个教师岗位。'),
    W('work', 'deadline', '/ˈdedlaɪn/', 'n.', '截止日期', 'The deadline for applications is next Friday.', '申请截止日期是下周五。'),
    W('work', 'colleague', '/ˈkɒliːɡ/', 'n.', '同事', 'She gets on well with her colleagues.', '她和同事相处融洽。'),
    W('work', 'resign', '/rɪˈzaɪn/', 'v.', '辞职', 'The manager resigned after only six months.', '这位经理上任仅六个月就辞职了。'),
    W('work', 'salary', '/ˈsæləri/', 'n.', '薪金；工资', 'Nurses are demanding a higher starting salary.', '护士们要求提高起薪。'),

    W('health', 'chronic', '/ˈkrɒnɪk/', 'adj.', '慢性的；长期的', 'Chronic stress is linked to a range of illnesses.', '长期压力与多种疾病相关。'),
    W('health', 'nutrition', '/njuˈtrɪʃn/', 'n.', '营养', 'Schools are teaching the basics of good nutrition.', '学校正在教授合理营养的基础知识。'),
    W('health', 'sedentary', '/ˈsedntri/', 'adj.', '久坐的', 'A sedentary lifestyle increases the risk of heart disease.', '久坐不动的生活方式会增加患心脏病的风险。'),
    W('health', 'immune', '/ɪˈmjuːn/', 'adj.', '免疫的', 'Sleep helps keep the immune system strong.', '睡眠有助于保持免疫系统强健。'),
    W('health', 'epidemic', '/ˌepɪˈdemɪk/', 'n.', '流行病；泛滥', 'Obesity has reached epidemic proportions in some regions.', '肥胖在一些地区已泛滥成灾。'),
    W('health', 'prescription', '/prɪˈskrɪpʃn/', 'n.', '处方', 'Antibiotics are available only with a prescription.', '抗生素须凭处方购买。'),
    W('health', 'therapeutic', '/ˌθerəˈpjuːtɪk/', 'adj.', '治疗的；有疗效的', 'Gardening can have therapeutic benefits.', '园艺可能具有治疗功效。'),
    W('health', 'obesity', '/əʊˈbiːsəti/', 'n.', '肥胖（症）', 'Childhood obesity is linked to sugary drinks.', '儿童肥胖与含糖饮料有关。'),
    W('health', 'diagnosis', '/ˌdaɪəɡˈnəʊsɪs/', 'n.', '诊断', 'Early diagnosis greatly improves survival rates.', '早期诊断能大幅提高存活率。'),
    W('health', 'well-being', '/ˌwelˈbiːɪŋ/', 'n.', '幸福安康', 'Green spaces in cities improve residents’ well-being.', '城市绿地能提升居民的幸福感。'),
    W('health', 'symptom', '/ˈsɪmptəm/', 'n.', '症状', 'A persistent cough is a common symptom of the flu.', '持续咳嗽是流感的常见症状。'),
    W('health', 'vaccine', '/ˈvæksiːn/', 'n.', '疫苗', 'The new vaccine offers protection for up to a year.', '这种新疫苗可提供长达一年的保护。'),
    W('health', 'hygiene', '/ˈhaɪdʒiːn/', 'n.', '卫生', 'Good hand hygiene prevents the spread of infection.', '良好的手部卫生能防止感染传播。'),
    W('health', 'allergy', '/ˈælədʒi/', 'n.', '过敏', 'Peanut allergies are becoming more common among children.', '花生过敏在儿童中越来越常见。'),
    W('health', 'remedy', '/ˈremədi/', 'n.', '疗法；补救办法', 'Ginger tea is a popular remedy for a sore throat.', '姜茶是缓解喉咙痛的常用偏方。'),

    W('society', 'urbanisation', '/ˌɜːbənaɪˈzeɪʃn/', 'n.', '城市化', 'Rapid urbanisation has created huge demand for housing.', '快速城市化造成了巨大的住房需求。'),
    W('society', 'demographic', '/ˌdeməˈɡræfɪk/', 'adj./n.', '人口结构的；群体', 'The region is undergoing a major demographic shift.', '该地区正经历重大人口结构转变。'),
    W('society', 'poverty', '/ˈpɒvəti/', 'n.', '贫困', 'Many elderly people live below the poverty line.', '许多老年人生活在贫困线以下。'),
    W('society', 'inequality', '/ˌɪnɪˈkwɒləti/', 'n.', '不平等', 'The report highlights inequality between regions.', '该报告强调了地区间的不平等。'),
    W('society', 'infrastructure', '/ˈɪnfrəstrʌktʃə/', 'n.', '基础设施', 'Investment in infrastructure creates jobs.', '基础设施投资能创造就业。'),
    W('society', 'indigenous', '/ɪnˈdɪdʒənəs/', 'adj.', '本土的；土著的', 'The forest has been managed by indigenous peoples for centuries.', '这片森林由土著居民管理了数个世纪。'),
    W('society', 'migration', '/maɪˈɡreɪʃn/', 'n.', '迁移；移民', 'Economic migration often benefits both host and home countries.', '经济移民往往对接收国和母国都有益。'),
    W('society', 'welfare', '/ˈwelfeə/', 'n.', '福利', 'The welfare system supports the long-term unemployed.', '福利体系为长期失业者提供支持。'),
    W('society', 'juvenile', '/ˈdʒuːvənaɪl/', 'adj./n.', '青少年的；未成年人', 'Juvenile crime has fallen for five consecutive years.', '青少年犯罪已连续五年下降。'),
    W('society', 'household', '/ˈhaʊshəʊld/', 'n.', '家庭；户', 'The average household now owns at least two cars.', '普通家庭现在至少拥有两辆车。'),
    W('society', 'legislation', '/ˌledʒɪsˈleɪʃn/', 'n.', '立法；法规', 'New legislation requires helmets for all cyclists.', '新法规要求所有骑车人佩戴头盔。'),
    W('society', 'subsidy', '/ˈsʌbsədi/', 'n.', '补贴；津贴', 'Farm subsidies keep food prices artificially low.', '农业补贴使食品价格维持在人为低位。'),
    W('society', 'offender', '/əˈfendə/', 'n.', '违法者；犯罪者', 'Young offenders are sent to education programmes.', '青少年违法者被送去参加教育项目。'),
    W('society', 'heritage', '/ˈherɪtɪdʒ/', 'n.', '遗产；传统', 'The old town is protected as a world heritage site.', '这座老城作为世界遗产地受到保护。'),
    W('society', 'density', '/ˈdensəti/', 'n.', '密度', 'The city centre has the highest population density.', '市中心的人口密度最高。'),

    W('media', 'biased', '/ˈbaɪəst/', 'adj.', '有偏见的', 'Critics claim the coverage is politically biased.', '批评者称该报道带有政治偏见。'),
    W('media', 'censorship', '/ˈsensəʃɪp/', 'n.', '审查（制度）', 'Filmmakers complain about strict censorship.', '电影导演抱怨审查严格。'),
    W('media', 'aesthetic', '/iːsˈθetɪk/', 'adj./n.', '美学的；美感', 'The building has little aesthetic appeal.', '这栋建筑几乎没有美感。'),
    W('media', 'contemporary', '/kənˈtemprəri/', 'adj.', '当代的', 'The gallery specialises in contemporary art.', '这家画廊专营当代艺术。'),
    W('media', 'exhibit', '/ɪɡˈzɪbɪt/', 'v./n.', '展览；展品', 'The museum will exhibit rarely seen photographs.', '该博物馆将展出罕见的照片。'),
    W('media', 'perspective', '/pəˈspektɪv/', 'n.', '视角；观点', 'Travelling gives you a fresh perspective on home.', '旅行能让你以全新视角看待家乡。'),
    W('media', 'portray', '/pɔːˈtreɪ/', 'v.', '描绘；刻画', 'The film portrays the scientist as a flawed hero.', '影片把这位科学家刻画成一个有缺陷的英雄。'),
    W('media', 'mainstream', '/ˈmeɪnstriːm/', 'adj.', '主流的', 'Renewable energy has entered the mainstream.', '可再生能源已进入主流。'),
    W('media', 'stereotype', '/ˈsteriətaɪp/', 'n.', '刻板印象', 'Advertisers are warned not to reinforce gender stereotypes.', '广告商被提醒不要强化性别刻板印象。'),
    W('media', 'credible', '/ˈkredəbl/', 'adj.', '可信的', 'Journalists must rely on credible sources.', '记者必须依靠可信的消息来源。'),
    W('media', 'broadcast', '/ˈbrɔːdkɑːst/', 'v./n.', '广播；播出', 'The match will be broadcast live around the world.', '这场比赛将向全球直播。'),
    W('media', 'headline', '/ˈhedlaɪn/', 'n.', '标题；头条', 'The scandal dominated the headlines for weeks.', '这桩丑闻连续数周占据头条。'),
    W('media', 'editorial', '/ˌedɪˈtɔːriəl/', 'n./adj.', '社论；编辑的', 'The editorial criticised the government’s housing policy.', '这篇社论批评了政府的住房政策。'),
    W('media', 'narrative', '/ˈnærətɪv/', 'n.', '叙事；说法', 'The film challenges the usual narrative of progress.', '这部电影挑战了惯常的进步叙事。'),
    W('media', 'viral', '/ˈvaɪrəl/', 'adj.', '病毒式传播的', 'Her graduation speech went viral overnight.', '她的毕业演讲一夜之间疯传。'),

    W('academic', 'analyse', '/ˈænəlaɪz/', 'v.', '分析', 'The study analyses data collected from forty hospitals.', '该研究分析了从 40 家医院收集的数据。'),
    W('academic', 'evaluate', '/ɪˈvæljueɪt/', 'v.', '评估；评价', 'Teachers evaluate students through continuous assessment.', '教师通过持续性评估来评价学生。'),
    W('academic', 'constitute', '/ˈkɒnstɪtjuːt/', 'v.', '构成；组成', 'Women constitute nearly half the workforce.', '女性几乎占劳动力的一半。'),
    W('academic', 'derive', '/dɪˈraɪv/', 'v.', '获得；起源于', 'Many medicines are derived from tropical plants.', '许多药物从热带植物中提取。'),
    W('academic', 'establish', '/ɪˈstæblɪʃ/', 'v.', '建立；证实', 'The research failed to establish a clear link.', '该研究未能证实明确的关联。'),
    W('academic', 'fluctuate', '/ˈflʌktʃueɪt/', 'v.', '波动', 'Oil prices have fluctuated between sixty and eighty dollars.', '油价在 60 到 80 美元之间波动。'),
    W('academic', 'implement', '/ˈɪmplɪment/', 'v.', '实施；执行', 'The policy was implemented without enough funding.', '该政策在资金不足的情况下被实施。'),
    W('academic', 'undermine', '/ˌʌndəˈmaɪn/', 'v.', '削弱；损害', 'Constant criticism can undermine a child’s confidence.', '不断的批评会损害孩子的自信。'),
    W('academic', 'whereas', '/weərˈæz/', 'conj.', '然而；鉴于', 'Boys preferred team sports, whereas girls favoured individual ones.', '男孩更喜欢团队运动，而女孩更偏爱个人项目。'),
    W('academic', 'consequently', '/ˈkɒnsɪkwəntli/', 'adv.', '因此；结果', 'The bank refused further loans; consequently, the firm collapsed.', '银行拒绝追加贷款，这家公司因此倒闭了。'),
    W('academic', 'hypothesis', '/haɪˈpɒθəsɪs/', 'n.', '假设', 'The experiment was designed to test this hypothesis.', '这项实验旨在验证该假设。'),
    W('academic', 'significant', '/sɪɡˈnɪfɪkənt/', 'adj.', '显著的；重要的', 'There has been a significant drop in road deaths.', '道路死亡人数已显著下降。'),
    W('academic', 'valid', '/ˈvælɪd/', 'adj.', '有效的；站得住脚的', 'Her ticket is no longer valid for travel.', '她的车票已失效。'),
    W('academic', 'coherent', '/kəʊˈhɪərənt/', 'adj.', '连贯的；条理清楚的', 'The essay lacks a coherent argument.', '这篇文章缺乏连贯的论证。'),
    W('academic', 'criteria', '/kraɪˈtɪəriə/', 'n.', '标准（criterion 的复数）', 'Applicants are judged against the same criteria.', '所有申请者都按同一标准评判。')
  ];

  /* ============ 二、听力听写句 手写 3 难度 × 8 = 24 句（另有生成的雅思例句库 js/listening-bank.js 180 句，前端自动并入） ============ */
  // [难度, 完整句子, 挖空答案词, 中文]
  var L = function (level, sentence, answer, cn) {
  return { level: level, sentence: sentence, answer: answer, cn: cn };
  };
  var LISTENING = [
    L(1, 'The library will be closed throughout the public holiday.', 'throughout', '图书馆在整个公共假日期间都将关闭。'),
    L(1, 'Students are encouraged to participate in group discussions.', 'participate', '鼓励学生参与小组讨论。'),
    L(1, 'The new policy aims to reduce traffic in the city centre.', 'reduce', '新政策旨在缓解市中心的交通。'),
    L(1, 'Application forms must be submitted before the end of May.', 'submitted', '申请表必须在五月底前提交。'),
    L(1, 'The lecture has been moved to room three hundred and four on the second floor.', 'second', '讲座已移至二楼 304 室。'),
    L(1, 'The course fee includes accommodation and all weekday meals.', 'accommodation', '课程费用包含住宿和工作日全部餐食。'),
    L(1, 'You can get to the sports centre by taking bus number sixteen.', 'sixteen', '乘 16 路公交车可以到体育中心。'),
    L(1, 'The deadline for registration is the fifteenth of October.', 'fifteenth', '报名截止日期是 10 月 15 日。'),
    L(2, 'Researchers found a clear correlation between sleep and exam performance.', 'correlation', '研究人员发现睡眠与考试成绩之间存在明显关联。'),
    L(2, 'The committee recommended that the proposal be substantially revised.', 'substantially', '委员会建议对该提案进行实质性修改。'),
    L(2, 'Although the device is expensive, it considerably reduces energy use.', 'considerably', '尽管该设备昂贵，但它能大幅降低能耗。'),
    L(2, 'The archaeological site is inaccessible to the general public.', 'inaccessible', '该考古遗址不对公众开放。'),
    L(2, 'Participants were required to complete a preliminary questionnaire.', 'preliminary', '参与者需完成一份初步问卷。'),
    L(2, 'The survey revealed a significant disparity between urban and rural incomes.', 'disparity', '调查显示城乡收入存在显著差距。'),
    L(2, 'Attendance at the workshop is entirely voluntary, but strongly recommended.', 'voluntary', '参加研讨会完全自愿，但强烈建议出席。'),
    L(2, 'The government has pledged to subsidise public transport for students.', 'subsidise', '政府已承诺为学生补贴公共交通。'),
    L(3, 'The methodology, though unconventional, yielded remarkably consistent results.', 'unconventional', '该方法虽非传统，却得出了高度一致的结果。'),
    L(3, 'A disproportionate share of funding was allocated to infrastructure.', 'disproportionate', '不成比例的大笔资金被拨给了基础设施。'),
    L(3, 'The findings unequivocally challenge the assumptions of earlier studies.', 'unequivocally', '这些发现明确地质疑了早期研究的假设。'),
    L(3, 'Subsequent investigations corroborated the witness’s account.', 'corroborated', '随后的调查证实了证人的说法。'),
    L(3, 'The phenomenon is attributable, at least in part, to accelerated urbanisation.', 'attributable', '这种现象至少可以部分归因于加速的城市化。'),
    L(3, 'The results were inconsistent with the hypotheses proposed in earlier literature.', 'hypotheses', '结果与早期文献中提出的假设不一致。'),
    L(3, 'Such an ambitious undertaking inevitably entails considerable financial risk.', 'entails', '如此雄心勃勃的事业必然伴随相当大的财务风险。'),
    L(3, 'The treaty was ratified despite vehement opposition from rural constituencies.', 'vehement', '尽管农村选区强烈反对，该条约仍获得了批准。')
  ];

  /* ============ 二·B、日常口语随身听（生活场景短句，英文 → 中文翻译 连续播报） ============ */
  // 条目格式：[英文原句（地道口语）, 中文翻译]
  var PG = function (id, name, en, items) {
    return { id: id, name: name, en: en, items: items };
  };
  var DAILY_PHRASES = [
    PG('greet', '问候寒暄', 'Greetings', [
      ['Hey! Long time no see. How have you been?', '嘿！好久不见，最近怎么样？'],
      ['Pretty good, thanks. Can\'t complain.', '挺好的，谢谢，没什么可抱怨的。'],
      ['How\'s everything going with work these days?', '最近工作还顺利吗？'],
      ['Not bad. I\'ve been keeping busy.', '还行，一直挺忙的。'],
      ['What have you been up to lately?', '你最近在忙什么呢？'],
      ['Same old, same old. Just work and home.', '老样子，就是公司和家里两头跑。'],
      ['Nice weather we\'re having, isn\'t it?', '今天天气真不错，是吧？'],
      ['Yeah, perfect for a walk outside.', '是啊，特别适合出去走走。'],
      ['How was your weekend? Did you do anything fun?', '周末过得怎么样？玩什么了吗？'],
      ['I just stayed home and caught up on sleep.', '就待在家里补觉了。'],
      ['Say hi to your parents for me.', '替我向你爸妈问好。'],
      ['Sure, I\'ll let them know.', '好，我会转告他们的。'],
      ['Sorry, I didn\'t catch your name.', '不好意思，我没听清你的名字。'],
      ['It\'s fine — I\'m Mike, by the way.', '没关系，顺便说一下，我叫迈克。'],
      ['Take care on your way home.', '回家路上小心。'],
      ['You too. Talk to you later!', '你也是，回头聊！'],
      ['Fancy meeting you here! What a coincidence.', '居然在这儿碰到你，太巧了。'],
      ['I was just about to call you.', '我正准备给你打电话呢。']
    ]),
    PG('intro', '介绍·交朋友', 'Making Friends', [
      ['Hi, I don\'t think we\'ve met. I\'m Sarah.', '嗨，我们好像没见过，我是萨拉。'],
      ['Nice to meet you, Sarah. I\'m Tom.', '很高兴认识你，萨拉，我是汤姆。'],
      ['What do you do for a living?', '你是做什么工作的？'],
      ['I work in marketing. What about you?', '我做市场营销，你呢？'],
      ['I\'m a software engineer at a tech company.', '我在一家科技公司当软件工程师。'],
      ['Where are you from originally?', '你老家是哪儿的？'],
      ['I\'m from Chengdu, but I\'ve lived here for years.', '我是成都人，但在这儿住了很多年了。'],
      ['How do you know the host?', '你是怎么认识主人的？'],
      ['We went to university together.', '我们是大学同学。'],
      ['Do you mind if I sit here?', '介意我坐这儿吗？'],
      ['Not at all, go ahead.', '完全不介意，请坐。'],
      ['Sorry, what was your name again?', '不好意思，你叫什么来着？'],
      ['Could I get your WeChat? Easier to stay in touch.', '能加个微信吗？方便以后联系。'],
      ['Sure, let me scan your QR code.', '好啊，我扫你的二维码吧。'],
      ['What do you like to do in your free time?', '你空闲时间喜欢做什么？'],
      ['I\'m into hiking and photography.', '我喜欢徒步和摄影。'],
      ['Your English is really good. How did you learn it?', '你英语真好，是怎么学的？'],
      ['Thanks! I mostly picked it up from movies.', '谢谢！主要是看电影耳濡目染学的。']
    ]),
    PG('cafe', '咖啡·快餐', 'Cafe & Fast Food', [
      ['Hi, what can I get for you today?', '您好，今天想喝点什么？'],
      ['Can I get a medium latte, please?', '请给我一杯中杯拿铁。'],
      ['For here or to go?', '在这儿喝还是带走？'],
      ['To go, please.', '带走，谢谢。'],
      ['Would you like anything to eat?', '要来点吃的吗？'],
      ['Yeah, I\'ll have a blueberry muffin.', '好，来一个蓝莓玛芬。'],
      ['Would you like your latte hot or iced?', '拿铁要热的还是冰的？'],
      ['Iced, with less ice, please.', '冰的，少冰，谢谢。'],
      ['Anything else?', '还要别的吗？'],
      ['That\'s it, thanks.', '就这些，谢谢。'],
      ['It\'s twenty-eight yuan altogether.', '一共二十八元。'],
      ['Can I scan to pay?', '我可以扫码付款吗？'],
      ['Of course, the QR code is right here.', '可以，二维码就在这儿。'],
      ['Sorry, the payment didn\'t go through.', '不好意思，支付没成功。'],
      ['Let me try again.', '我再试一次。'],
      ['Your order will be ready in a few minutes.', '您的餐点几分钟后就好。'],
      ['Could I get an extra napkin and a straw?', '能再给我一张纸巾和一根吸管吗？'],
      ['Sorry, does this have nuts in it? I\'m allergic.', '不好意思，这里面有坚果吗？我过敏。'],
      ['Enjoy your drink!', '请慢用！'],
      ['Thanks, you too.', '谢谢，你也一样。']
    ]),
    PG('restaurant', '餐厅点餐', 'At a Restaurant', [
      ['Hi, do you have a table for two?', '你好，有两人桌吗？'],
      ['Do you have a reservation?', '请问您有预订吗？'],
      ['No, we don\'t. How long is the wait?', '没有，要等多久？'],
      ['About fifteen minutes. I\'ll call your name.', '大约十五分钟，我会叫您的名字。'],
      ['Could we sit by the window?', '我们能坐窗边吗？'],
      ['Sure, right this way.', '可以，这边请。'],
      ['Are you ready to order?', '可以点餐了吗？'],
      ['Could you give us a couple more minutes?', '能再给我们几分钟吗？'],
      ['What do you recommend?', '你有什么推荐？'],
      ['The grilled fish is our signature dish.', '烤鱼是我们的招牌菜。'],
      ['I\'ll have that, and a Caesar salad to start.', '那就来这个，前菜要一份凯撒沙拉。'],
      ['How would you like your steak?', '牛排要几分熟？'],
      ['Medium, please.', '五分熟，谢谢。'],
      ['Could we have two glasses of water?', '能给我们两杯水吗？'],
      ['Still or sparkling?', '要静水还是气泡水？'],
      ['Tap water is fine, thanks.', '普通白开水就行，谢谢。'],
      ['Excuse me, we didn\'t order this.', '不好意思，这道菜我们没点。'],
      ['Sorry about that. I\'ll take it back.', '非常抱歉，我这就撤下去。'],
      ['Check, please. Do you take cards?', '买单，可以刷卡吗？'],
      ['Could we split the bill?', '我们能分开付吗？'],
      ['Service is included.', '服务费已经包含在里面了。']
    ]),
    PG('shop', '逛街购物', 'Shopping', [
      ['Hi, are you looking for anything in particular?', '您好，在找什么特别的东西吗？'],
      ['No thanks, I\'m just browsing.', '谢谢，我就随便看看。'],
      ['What size are you looking for?', '您要找什么尺码？'],
      ['A medium, usually.', '一般穿中码。'],
      ['Can I try this on?', '这个可以试穿吗？'],
      ['Sure, the fitting rooms are over there.', '可以，试衣间在那边。'],
      ['How does it fit?', '穿着合身吗？'],
      ['It\'s a bit tight around the shoulders.', '肩部有点紧。'],
      ['Do you have this in a larger size?', '这个有大一码的吗？'],
      ['Let me check the stock for you.', '我帮您查一下库存。'],
      ['Sorry, we\'re out of your size.', '不好意思，您要的码卖完了。'],
      ['Does this come in other colours?', '这个还有别的颜色吗？'],
      ['It comes in black, white, and beige.', '有黑色、白色和米色。'],
      ['Is this on sale?', '这个在打折吗？'],
      ['It\'s twenty percent off today.', '今天打八折。'],
      ['That\'s a bit pricey. Is there any discount?', '有点贵，能优惠点吗？'],
      ['Sorry, that\'s already the best price.', '不好意思，这已经是最低价了。'],
      ['I\'ll take it. Could you gift-wrap it?', '我要了，能帮我包成礼物吗？'],
      ['Can I get a receipt, please?', '请给我小票好吗？'],
      ['I\'d like to return this. Here\'s my receipt.', '我想退掉这个，小票在这儿。'],
      ['Sorry, items on sale cannot be returned.', '不好意思，打折商品不能退货。']
    ]),
    PG('direction', '问路·交通', 'Getting Around', [
      ['Excuse me, how do I get to the nearest subway station?', '打扰一下，最近的地铁站怎么走？'],
      ['Go straight and turn left at the second crossing.', '直走，在第二个路口左转。'],
      ['Is it within walking distance?', '走路能到吗？'],
      ['About ten minutes on foot.', '走路大概十分钟。'],
      ['Sorry, I\'m new here. Could you show me on the map?', '不好意思，我刚来，能在地图上指给我吗？'],
      ['You\'re actually going the wrong way.', '你其实走反方向了。'],
      ['Which bus goes to the railway station?', '几路车去火车站？'],
      ['Bus sixteen, and get off at the third stop.', '16 路，第三站下车。'],
      ['How often does the bus come?', '公交车多久来一班？'],
      ['Every ten minutes or so.', '大概十分钟一班。'],
      ['Does this bus go past the museum?', '这趟车经过博物馆吗？'],
      ['Sorry, you\'ll need to change at the next stop.', '不好意思，你得在下一站换乘。'],
      ['One ticket to the airport, please.', '请来一张去机场的票。'],
      ['Which platform does the train leave from?', '火车在几号站台发车？'],
      ['Platform five. Mind the gap.', '五号站台，小心站台空隙。'],
      ['Could you call a taxi for me?', '能帮我叫辆出租车吗？'],
      ['How much is it to the city centre?', '到市中心多少钱？'],
      ['Could you drop me off at the next corner?', '能在下个路口让我下车吗？'],
      ['I\'m in a bit of a rush.', '我有点赶时间。'],
      ['Sorry, I think you overcharged me.', '不好意思，你好像多收我钱了。']
    ]),
    PG('travel', '机场·酒店', 'Travel & Hotel', [
      ['I\'d like to check in, please. I booked online.', '你好，我要入住，我在网上预订过。'],
      ['May I see your passport, please?', '请出示一下您的护照。'],
      ['Could you spell your last name?', '能拼一下您的姓吗？'],
      ['You\'re staying for three nights, is that right?', '您住三晚，对吗？'],
      ['Could I have a room on a higher floor?', '能给我安排高楼层的房间吗？'],
      ['Here\'s your key card. The lift is around the corner.', '这是您的房卡，电梯在拐角处。'],
      ['What time is breakfast served?', '早餐几点供应？'],
      ['From seven to ten, on the second floor.', '七点到十点，在二楼。'],
      ['Is Wi-Fi free? What\'s the password?', 'Wi-Fi 免费吗？密码是多少？'],
      ['Could I get a wake-up call at six tomorrow?', '明天早上六点能打电话叫早吗？'],
      ['The air conditioner doesn\'t work.', '空调坏了。'],
      ['I\'ll send someone up right away.', '我马上派人上去看。'],
      ['I\'d like to check out. Could I have the bill?', '我要退房，请结账。'],
      ['Could you keep my luggage here until this afternoon?', '行李能寄放到今天下午吗？'],
      ['Could you call me an airport shuttle?', '能帮我叫一辆机场大巴吗？'],
      ['I\'d like a window seat, please.', '我想要一个靠窗的座位。'],
      ['How many bags are you checking in?', '您有几件行李要托运？'],
      ['Just one carry-on.', '只有一件随身行李。'],
      ['Your flight has been delayed by an hour.', '您的航班延误了一小时。'],
      ['Where\'s boarding gate twelve?', '12 号登机口在哪儿？']
    ]),
    PG('work', '职场办公', 'At Work', [
      ['Morning! Did you have a good weekend?', '早！周末过得好吗？'],
      ['Could we reschedule tomorrow\'s meeting?', '明天的会能改个时间吗？'],
      ['Sure, what time works for you?', '可以，你什么时间方便？'],
      ['Let\'s push it to three p.m.', '那就改到下午三点吧。'],
      ['Sorry I\'m late — the traffic was terrible.', '不好意思我迟到了，堵得厉害。'],
      ['No worries, we just got started.', '没事，我们刚开始。'],
      ['Could you send me that file after the meeting?', '会后能把那个文件发我吗？'],
      ['I\'ll copy you in on the email.', '我会在邮件里抄送你。'],
      ['Are you free for a quick call?', '你有空接个短电话吗？'],
      ['Give me five minutes to finish this.', '给我五分钟把这个弄完。'],
      ['Let\'s take this offline.', '这个我们线下再聊吧。'],
      ['Sorry, could you say that again? You cut out.', '不好意思，能再说一遍吗？你卡住了。'],
      ['I\'m working from home today.', '我今天居家办公。'],
      ['The deadline has been moved up to Friday.', '截止日期提前到周五了。'],
      ['Could you review my slides before I present?', '我汇报前你能帮我看看幻灯片吗？'],
      ['Nice work on the presentation.', '这次汇报做得不错。'],
      ['I\'d like to take a day off next Monday.', '下周一我想请一天假。'],
      ['Could you cover for me while I\'m away?', '我不在的时候能帮我顶一下吗？'],
      ['Let\'s call it a day.', '今天就干到这儿吧。'],
      ['Sorry to bother you after hours.', '不好意思，下班了还打扰你。']
    ]),
    PG('phone', '打电话·消息', 'Calls & Messages', [
      ['Hi, can I speak to Lisa, please?', '你好，请问莉萨在吗？'],
      ['Speaking. Who\'s calling?', '我就是，请问哪位？'],
      ['Hold on a second, I\'ll get her.', '稍等，我去叫她。'],
      ['Sorry, she\'s in a meeting right now.', '不好意思，她正在开会。'],
      ['Can I take a message?', '需要我捎个话吗？'],
      ['Could you ask her to call me back?', '能让她给我回个电话吗？'],
      ['Sorry, I think you\'ve got the wrong number.', '不好意思，你好像打错了。'],
      ['The line is breaking up.', '信号不好，声音断断续续的。'],
      ['I\'ll text you the details later.', '详情我晚点发消息给你。'],
      ['Did you get my message last night?', '我昨晚发的消息你收到了吗？'],
      ['Sorry, I missed your call.', '不好意思，我没接到你的电话。'],
      ['My phone died. Let me find a charger.', '我手机没电了，我找个充电器。'],
      ['Could you send that to my email instead?', '能改发到我邮箱吗？'],
      ['I\'ll put you on speaker.', '我开免提了。'],
      ['Let me give you a ring tomorrow.', '我明天给你打电话。'],
      ['Sorry, I\'m on another call. Can I call you back?', '不好意思我在接另一个电话，回头打给你行吗？']
    ]),
    PG('money', '银行·邮局', 'Bank & Post Office', [
      ['I\'d like to open a bank account.', '我想开一个银行账户。'],
      ['Please fill in this form first.', '请先填一下这张表。'],
      ['I\'d like to withdraw five hundred yuan.', '我想取五百元。'],
      ['Could you enter your PIN, please?', '请输入密码。'],
      ['The ATM swallowed my card.', '取款机把我的卡吞了。'],
      ['I\'d like to transfer some money overseas.', '我想往境外汇点钱。'],
      ['What\'s the exchange rate today?', '今天的汇率是多少？'],
      ['Could I have some change for the vending machine?', '能换点零钱用自动售货机吗？'],
      ['I\'d like to send this parcel to Shanghai.', '我想把这个包裹寄到上海。'],
      ['How much is the postage?', '邮费多少钱？'],
      ['Standard delivery takes about three days.', '普通快递大概三天到。'],
      ['I need to send it by express.', '我要寄加急快递。'],
      ['Could I have the tracking number?', '能给我快递单号吗？'],
      ['This letter needs to be registered.', '这封信要寄挂号。']
    ]),
    PG('doctor', '看病买药', 'At the Doctor', [
      ['Hi, I\'d like to see a doctor.', '你好，我想看医生。'],
      ['Do you have an appointment?', '您有预约吗？'],
      ['What seems to be the problem?', '哪里不舒服？'],
      ['I\'ve had a headache and a sore throat since yesterday.', '我从昨天起头疼，嗓子也疼。'],
      ['How long have you felt like this?', '这样多久了？'],
      ['Do you have a fever?', '发烧吗？'],
      ['I feel a bit under the weather.', '我感觉有点不舒服。'],
      ['I\'ve been coughing badly at night.', '我晚上咳得厉害。'],
      ['Let me take your temperature.', '我给你量一下体温。'],
      ['Take a deep breath, please.', '请深吸一口气。'],
      ['It\'s nothing serious, just a cold.', '没什么大问题，就是感冒了。'],
      ['I\'ll write you a prescription.', '我给你开个处方。'],
      ['Are you allergic to any medicine?', '你对什么药物过敏吗？'],
      ['Take this after meals, three times a day.', '这个饭后吃，一天三次。'],
      ['Get plenty of rest and drink lots of water.', '多休息，多喝水。'],
      ['How long will it take to recover?', '多久能好？'],
      ['You should feel better in a few days.', '过几天应该就会好转。'],
      ['I\'d like to get this prescription filled.', '我想按这个处方配药。']
    ]),
    PG('home', '居家·租房', 'Home & Renting', [
      ['I\'m running a bit late. Could you start dinner?', '我要晚点儿到，你能先做晚饭吗？'],
      ['Could you take out the rubbish? It\'s bin day tomorrow.', '你能把垃圾倒了吗？明天收垃圾。'],
      ['Don\'t forget to lock the door.', '别忘了锁门。'],
      ['The Wi-Fi keeps cutting out.', 'Wi-Fi 老是断。'],
      ['Have you tried turning the router off and on again?', '你试过把路由器重启一下吗？'],
      ['We\'re out of milk and eggs.', '牛奶和鸡蛋都没了。'],
      ['Could you pick up some fruit on your way home?', '回家路上能买点水果吗？'],
      ['I\'ll do the dishes if you cook.', '你做饭的话我来洗碗。'],
      ['Could you keep it down? The baby\'s asleep.', '能小点声吗？宝宝睡了。'],
      ['The bathroom light has burned out.', '卫生间的灯泡坏了。'],
      ['I\'m looking for a flat to rent.', '我在找房子租。'],
      ['The rent is three thousand a month, bills not included.', '房租每月三千，不含水电杂费。'],
      ['Is the deposit refundable?', '押金能退吗？'],
      ['Could the landlord fix the heater?', '房东能修一下暖气吗？'],
      ['The neighbours are making too much noise.', '邻居太吵了。'],
      ['I\'ll tidy up a bit before the guests arrive.', '客人来之前我稍微收拾一下。'],
      ['What do you fancy for dinner?', '晚饭想吃什么？'],
      ['Let\'s order takeaway tonight.', '今晚点外卖吧。']
    ]),
    PG('feelings', '观点·情绪', 'Opinions & Feelings', [
      ['To be honest, I don\'t really like it.', '老实说，我不太喜欢。'],
      ['I know exactly how you feel.', '我完全懂你的感受。'],
      ['That sounds like a great idea.', '这个主意听起来真棒。'],
      ['I\'m not so sure about that.', '这事儿我不太确定。'],
      ['It depends. Let me think about it.', '看情况吧，让我想想。'],
      ['I couldn\'t agree more.', '我再同意不过了。'],
      ['Sorry, I didn\'t mean to upset you.', '抱歉，我不是故意惹你不开心的。'],
      ['Never mind. It\'s not a big deal.', '没关系，不是什么大事。'],
      ['I\'m a bit nervous about the interview.', '面试我有点紧张。'],
      ['Don\'t worry. You\'ll do great.', '别担心，你肯定没问题。'],
      ['I\'m so proud of you.', '我真为你骄傲。'],
      ['Thanks for always having my back.', '谢谢你一直挺我。'],
      ['I\'ve had a long day. I\'m exhausted.', '今天太累了，筋疲力尽。'],
      ['Let\'s call it even.', '我们扯平吧。'],
      ['It slipped my mind. Sorry about that.', '我一下给忘了，不好意思。'],
      ['That really made my day.', '这真让我开心了一整天。'],
      ['I can\'t thank you enough.', '真是太感谢你了。'],
      ['Take your time. There\'s no rush.', '慢慢来，不急。'],
      ['I\'m sorry to hear that.', '听到这个消息我很难过。'],
      ['Cheers! I owe you one.', '谢啦！欠你个人情。']
    ]),
    PG('plans', '邀约社交', 'Making Plans', [
      ['Are you doing anything this Saturday?', '这周六你有事吗？'],
      ['Nothing special. What\'s up?', '没什么安排，怎么了？'],
      ['Would you like to grab dinner sometime?', '找个时间一起吃个晚饭好吗？'],
      ['I\'d love to. What time?', '好啊，几点？'],
      ['How about seven at the usual place?', '七点老地方怎么样？'],
      ['Sounds good. See you then.', '行，到时候见。'],
      ['Sorry, I can\'t make it tonight.', '不好意思，今晚我来不了。'],
      ['Let\'s take a rain check.', '这次先算了，下次再约吧。'],
      ['Could you make it a bit later?', '能稍微晚一点吗？'],
      ['I\'ll meet you outside the cinema at six.', '六点电影院门口见。'],
      ['Sorry I\'m late. Have you been waiting long?', '不好意思来晚了，等很久了吧？'],
      ['Don\'t worry, I just got here myself.', '没事，我也刚到。'],
      ['It\'s on me tonight.', '今晚我请客。'],
      ['Shall we go Dutch?', '我们 AA 吧？'],
      ['Let\'s keep in touch.', '保持联系啊。'],
      ['I had a really good time tonight.', '今晚我玩得很开心。'],
      ['Thanks for inviting me.', '谢谢你邀请我。'],
      ['Give me a shout when you\'re free.', '有空了喊我一声。']
    ]),
    PG('help', '紧急求助', 'Emergencies', [
      ['Help! Someone stole my phone.', '来人啊！有人偷了我的手机。'],
      ['Call the police, please.', '请快报警。'],
      ['I need to report a lost wallet.', '我要报失一个钱包。'],
      ['Is there a pharmacy nearby?', '附近有药店吗？'],
      ['Could you help me, please? I\'m lost.', '能帮帮我吗？我迷路了。'],
      ['I\'ve lost my passport. What should I do?', '我的护照丢了，该怎么办？'],
      ['Please take me to the nearest hospital.', '请带我去最近的医院。'],
      ['Is anyone here a doctor?', '现场有医生吗？'],
      ['Call an ambulance!', '快叫救护车！'],
      ['Watch out! There\'s a car coming.', '小心！有车过来了。'],
      ['My friend has fainted.', '我朋友晕倒了。'],
      ['Could I borrow your phone? Mine was stolen.', '能借你手机用一下吗？我的被偷了。'],
      ['Where\'s the nearest fire exit?', '最近的消防通道在哪儿？'],
      ['Don\'t worry, the police are on their way.', '别担心，警察马上就到。']
    ])
  ];

  /* ============ 三、阅读 2 篇（T/F/NG + 单选，各 8 题） ============ */
  var READING = [
    {
      id: 'kelp',
      title: 'The Rebirth of the Kelp Forest',
      topic: '环境 · 自然保护',
      minutes: 9,
      paragraphs: [
        'Beneath the cool waters off the western coast of North America lies one of the ocean’s most productive habitats: the kelp forest. These underwater jungles, formed by brown algae that can grow up to half a metre in a single day, shelter hundreds of species, from sea otters to spiny lobsters. Yet over the past two decades, warming waters and an explosion in the population of purple sea urchins have destroyed more than ninety per cent of the kelp in some regions.',
        'The collapse was swift. In 2013, a mysterious disease wiped out vast numbers of sunflower sea stars, a major predator of sea urchins. At roughly the same time, a marine heatwave — later nicknamed “the Blob” — weakened the kelp itself. With its grazers unchecked and its resilience low, the forest turned into a barren landscape carpeted with urchins.',
        'Recently, however, a coalition of divers, scientists and indigenous communities has begun to fight back. The strategy is straightforward in principle: remove enough urchins, and the kelp returns. Teams of volunteer divers descend into the barrens with hammers, collecting the urchins in sacks. In selected plots, they have removed more than ninety-five per cent of the creatures.',
        'The results have surprised even the optimists. In one monitored site off the coast of Oregon, juvenile kelp appeared within months of the clearance, and canopy cover reached pre-decline levels within two years. Fish and lobsters soon followed. Crucially, the recovered plots proved more resistant to a second heatwave in 2019, suggesting that restoration, once established, can buffer the ecosystem against further shocks.',
        'Yet the approach has limits. Clearing urchins by hand is expensive and slow, and the barrens now stretch across thousands of square kilometres. Some economists argue that the money would be better spent cutting the emissions that drive marine heatwaves. Conservationists reply that the two goals are complementary rather than competing.',
        'An imaginative twist has come from the kitchen. Purple urchins, once considered worthless by fishermen, have appeared on the menus of high-end restaurants, where their roe is marketed as a sustainable delicacy. A commercial fishery, its supporters claim, could clear far more urchins than volunteer divers ever could. Sceptics note that demand for a niche ingredient may never match the scale of the problem, and that heavy fishing could eventually remove an animal that the recovering forest still needs as part of its natural balance.',
        'For now, the divers measure success one plot at a time. As one researcher put it, the kelp forest may never return to exactly what it was — but a forest that is different can still be a forest.'
      ],
      questions: [
        { type: 'tfng', q: 'Kelp can grow as much as half a metre in a day.', a: 'T', why: '第 1 段明确说褐藻“can grow up to half a metre in a single day”。' },
        { type: 'tfng', q: 'The disease that appeared in 2013 directly harmed sea urchins.', a: 'F', why: '第 2 段：疾病消灭的是海胆的主要捕食者向日葵海星（sunflower sea stars），并非海胆本身；海胆反而因此泛滥。' },
        { type: 'tfng', q: 'Some regions have lost over ninety per cent of their kelp.', a: 'T', why: '第 1 段：“destroyed more than ninety per cent of the kelp in some regions”。' },
        { type: 'tfng', q: 'Volunteer divers use chemicals to kill the urchins.', a: 'NG', why: '第 3 段只提到潜水员用锤子把海胆装进袋子，全文既未说使用化学药剂、也未否认。' },
        { type: 'tfng', q: 'The restored kelp plots were completely unaffected by the 2019 heatwave.', a: 'F', why: '第 4 段只说恢复区“more resistant（更有抵抗力）”，能缓冲冲击，并非完全不受影响。' },
        {
          type: 'mc', q: 'What do the economists mentioned in paragraph 5 believe?', a: 'B',
          opts: ['Urchin removal is surprisingly cheap and effective.', 'Funds should instead be directed towards reducing emissions.', 'Restoration work should be limited to a few test plots.', 'More volunteer divers should be professionally trained.'],
          why: '第 5 段：经济学家认为钱更应花在削减导致海洋热浪的排放上。'
        },
        {
          type: 'mc', q: 'According to the passage, why have purple urchins appeared in high-end restaurants?', a: 'C',
          opts: ['Scientists proved their roe cures certain diseases.', 'Fishing communities have always considered them a luxury food.', 'Supporters hope commercial demand will help clear the barrens.', 'Restaurants are required by law to use sustainable seafood.'],
          why: '第 6 段：支持者认为商业化捕捞能比志愿者清除更多海胆；海胆籽被当作可持续美食营销。'
        },
        {
          type: 'mc', q: 'What concern do sceptics raise about the commercial fishery?', a: 'A',
          opts: ['Demand may be insufficient and overfishing could disturb the ecosystem’s balance.', 'The roe is likely to be unsafe after the heatwaves.', 'Restaurants will refuse to pay the high prices fishermen need.', 'Tourists will damage the newly recovered kelp plots.'],
          why: '第 6 段末：怀疑者指出小众食材需求可能远不够，而且过度捕捞会移除森林自然平衡仍需要的动物。'
        }
      ]
    },
    {
      id: 'habit',
      title: 'The Architecture of Habit',
      topic: '心理学 · 行为科学',
      minutes: 9,
      paragraphs: [
        'In 1892, the psychologist William James observed that daily life is, in his words, nothing but a mass of habits. Modern research largely agrees: estimates suggest that around forty-five per cent of everyday actions are performed not from deliberate decision, but from habit. Understanding how habits form has become one of the most practical projects in psychology.',
        'Researchers describe habit formation as a three-step loop. First comes a cue — a time, a place, or an emotional state that triggers the brain to switch to automatic mode. Then follows the routine, the behaviour itself. Finally there is a reward, which tells the brain whether the loop is worth remembering. Over time, the brain begins to anticipate the reward as soon as it encounters the cue, and a behaviour that once required willpower becomes effortless.',
        'A long-running study at University College London tracked how long new habits take to form. Contrary to the popular belief that twenty-one days is sufficient, participants needed an average of sixty-six days for a new behaviour to feel automatic. Individual variation was enormous: some people reached the plateau in eighteen days, while others required more than two hundred and fifty. The single most important factor was not intensity of effort but simple consistency; missing a single day, encouragingly, did not measurably slow progress.',
        'The cue is where most attempts at change go wrong. People who resolve simply to “exercise more” give their brain no specific trigger. Successful habit-builders tie the new action to an established one: after I pour my morning coffee, I will do five minutes of stretching. This technique, sometimes called habit stacking, exploits the fact that existing habits are already reliably cued by the environment.',
        'Willpower, by contrast, appears to be a poor long-term strategy. In one famous experiment, children who were asked to resist eating sweets subsequently gave up sooner on an impossible puzzle, as though self-control were a fuel that had been spent. The finding helped popularise the idea of ego depletion, although later studies found the effect weaker and less universal than first claimed.',
        'Companies, of course, have been quick to apply this science. Mobile apps engineer variable rewards — unpredictable likes, streaks and notifications — precisely because an uncertain reward is remembered more strongly than a guaranteed one. Critics worry that the same mechanisms which help people floss and jog can also keep them scrolling.',
        'The encouraging message from the research is modest rather than magical. Habits cannot be installed overnight, and no environment can remove the need for choice. But a well-designed cue, a small and repeated action, and an immediate reward can, given enough weeks, quietly rebuild a life.'
      ],
      questions: [
        { type: 'tfng', q: 'About forty-five per cent of daily actions are believed to be habitual.', a: 'T', why: '第 1 段：“around forty-five per cent of everyday actions … from habit”。' },
        { type: 'tfng', q: 'The reward helps the brain decide whether to remember the habit loop.', a: 'T', why: '第 2 段：奖励“tells the brain whether the loop is worth remembering”。' },
        { type: 'tfng', q: 'The UCL study confirmed that a habit can be formed in twenty-one days.', a: 'F', why: '第 3 段：与流行的 21 天说法相反，平均需要 66 天。' },
        { type: 'tfng', q: 'In the study, skipping one day clearly delayed habit formation.', a: 'F', why: '第 3 段：漏掉一天“did not measurably slow progress”，即没有明显拖慢进度。' },
        { type: 'tfng', q: 'Habit stacking means linking a new behaviour to an existing habit.', a: 'T', why: '第 4 段：把新动作绑定到既定动作（如冲咖啡后做拉伸）。' },
        {
          type: 'mc', q: 'What did the sweet-resisting experiment suggest about self-control?', a: 'B',
          opts: ['It is strengthened by repeated temptation.', 'It behaves like a limited resource that can be used up.', 'It is impossible to measure scientifically.', 'It is unrelated to performance on puzzles.'],
          why: '第 5 段：忍住不吃糖的孩子更快放弃，仿佛自控是被耗尽的燃料，即“自我损耗”说。'
        },
        {
          type: 'mc', q: 'Why do mobile apps deliberately use unpredictable rewards?', a: 'D',
          opts: ['They are cheaper to programme than fixed rewards.', 'Regulations require apps to vary their notifications.', 'Guaranteed rewards make users feel anxious.', 'Uncertain rewards are remembered more strongly by the brain.'],
          why: '第 6 段：“an uncertain reward is remembered more strongly than a guaranteed one”。'
        },
        {
          type: 'mc', q: 'What did later studies conclude about ego depletion?', a: 'C',
          opts: ['They completely rejected the original experiment.', 'They proved the effect applies equally to everyone.', 'They found the effect weaker and less universal than first thought.', 'They showed children are unaffected by it.'],
          why: '第 5 段末：后续研究发现该效应比最初宣称的更弱、更不具普遍性。'
        }
      ]
    },
    {
      id: 'hiring',
      title: 'Hired by an Algorithm',
      topic: '科技 · 人工智能',
      minutes: 9,
      paragraphs: [
        'Over the past decade, the first reader of most job applications has quietly stopped being human. A majority of large employers now use some form of automated screening to sift through the hundreds of CVs that a single vacancy can attract. Supporters argue that software is not only faster than a tired recruiter but fairer too: every applicant, in theory, is measured against exactly the same criteria.',
        'The technology varies in sophistication. Simple systems search CVs for keywords and qualifications. More advanced ones are trained on historical data — the profiles of people a company hired in the past and who went on to succeed — and learn to spot patterns no human would notice, from the length of a candidate’s previous jobs to the verbs they favour. Some platforms go further still, analysing recorded video interviews for tone of voice and word choice.',
        'The central worry is bias. A much-discussed experiment at a major online retailer illustrates the risk: engineers built a screening tool trained on ten years of hiring data, but because the technology industry had historically employed far more men than women, the system taught itself to penalise CVs containing the word “women’s”, as in “women’s debating society”. The project was quietly abandoned. The lesson is uncomfortable but clear: an algorithm trained on the past does not erase the past’s prejudices — it automates them.',
        'Regulators have begun to respond. New York City now requires employers to inform candidates when automated tools are used in hiring and to have such systems audited for bias every year. The European Union has gone further, classifying recruitment algorithms as “high-risk” applications that demand human oversight. Neither approach, however, requires companies to reveal the inner workings of their software.',
        'Meanwhile, candidates are learning to fight fire with fire. Career websites openly advise applicants to stuff their CVs with the keywords the software expects, and a growing number of jobseekers use artificial intelligence to write their applications — which are then read, of course, by artificial intelligence. Some employers, exasperated by this arms race, have begun to abandon the CV altogether in favour of task-based tests done anonymously online.',
        'Such tests may be more than a gesture of frustration. Decades of research in occupational psychology suggest that structured assessments of actual skills predict job performance far better than the impressions gleaned from a CV. Algorithms are superb at checking credentials quickly and consistently; they are far weaker at judging potential, creativity or the ability to grow into a role.',
        'None of this means the machines should be shown the door. Used well, automated screening can widen the pool of candidates and free recruiters to spend time with people rather than paperwork. The employers who benefit most seem to be those who treat the algorithm as an adviser rather than a gatekeeper — and who remember that hiring, in the end, is a human decision.'
      ],
      questions: [
        { type: 'tfng', q: 'Most large employers now make some use of automated screening in recruitment.', a: 'T', why: '第 1 段：“A majority of large employers now use some form of automated screening”。' },
        { type: 'tfng', q: 'The retailer’s screening tool was abandoned because it favoured female applicants.', a: 'F', why: '第 3 段：该系统学会惩罚含 “women’s” 的简历，对女性不利，因此被放弃，并非偏袒女性。' },
        { type: 'tfng', q: 'New York City requires employers to publish the source code of their hiring software.', a: 'NG', why: '第 4 段只提到告知候选人与年度偏见审计；末句明确说两种监管都不要求公开软件内部机制。' },
        { type: 'tfng', q: 'Skill-based tests generally predict job performance better than CV screening.', a: 'T', why: '第 6 段：“predict job performance far better than the impressions gleaned from a CV”。' },
        { type: 'tfng', q: 'Video-interview software can reliably tell when a candidate is lying.', a: 'NG', why: '第 2 段只说平台分析语调与用词，全文未提识别谎言是否可靠。' },
        {
          type: 'mc', q: 'Why did the retailer’s tool disadvantage women?', a: 'B',
          opts: ['It was programmed to reject all applications without keywords.', 'It had learned patterns from a workforce that was mostly male.', 'It could not process applications from debating societies.', 'It was designed before video interviews became common.'],
          why: '第 3 段：训练数据来自以男性为主的行业招聘史，系统继承了这种偏差。'
        },
        {
          type: 'mc', q: 'What does the “arms race” in paragraph 5 refer to?', a: 'D',
          opts: ['Competition between companies to buy the best software.', 'Rivalry between regulators in New York and Europe.', 'The race to hire candidates before other firms do.', 'Candidates and employers both using AI to outmanoeuvre each other.'],
          why: '第 5 段：求职者用 AI 写简历、雇主用 AI 筛简历，互相角力，即为“军备竞赛”。'
        },
        {
          type: 'mc', q: 'What is the author’s overall conclusion?', a: 'C',
          opts: ['Automated screening should be banned in all recruitment.', 'Algorithms are already better than humans at judging potential.', 'Algorithms are best used to advise, while humans make the final decision.', 'CVs should be replaced entirely by anonymous online tests.'],
          why: '第 7 段：“treat the algorithm as an adviser rather than a gatekeeper”，录用终归是人的决定。'
        }
      ]
    }
  ];

  /* ============ 四、写作题库 ============ */
  var WRITING = [
    {
      id: 'w1', type: 'Task 2', typeCn: '议论文', time: 40, minWords: 250,
      prompt: 'Some people think environmental problems are too big for individuals to solve, and that only governments and large companies can make a difference. To what extent do you agree or disagree?',
      promptCn: '有人认为环境问题过于庞大，个人无法解决，只有政府和大企业才能带来改变。你在多大程度上同意或反对？',
      outline: ['开头：承认系统性变革不可或缺，但个人并非无能为力（部分不同意）', '主体段 1：政府/企业掌握关键杠杆——碳税、可再生能源、工业排放监管', '主体段 2：个人仍关键——消费需求塑造市场；选民与舆论推动立法', '自己观点：两层结合，政府让环保选择变容易，公民采用并施压', '结尾：个人与体系并非二选一'],
      model: 'Environmental problems such as climate change and pollution are now so vast that many people doubt individual action can matter, arguing that only governments and corporations possess the resources to act. While I agree that systemic change is indispensable, I disagree that individuals are powerless.\n\nIt is true that governments and large companies control the levers that matter most. States can impose carbon taxes, fund renewable energy and regulate industrial emissions, while multinational corporations decide how goods are manufactured and transported. No amount of household recycling, for instance, can compensate for unregulated factories. Coordinated policy can therefore achieve what isolated individuals cannot.\n\nNevertheless, individual choices remain essential for two reasons. First, consumer demand shapes markets: when large numbers of people prefer electric vehicles, plant-based food or energy-efficient appliances, companies compete to supply them and prices fall. Second, political action is itself taken by individuals. Voters who prioritise the climate elect the governments that pass ambitious laws, and public pressure has forced many firms to abandon single-use plastics.\n\nIn my view, the most effective approach combines both levels. Governments should create policies that make sustainable choices the easy ones, such as reliable public transport and subsidies for clean energy, but citizens must adopt those choices and demand further action.\n\nIn conclusion, although environmental challenges cannot be solved by individuals alone, personal behaviour and political pressure are the very forces that drive governments and companies to act. The choice is not between the individual and the system, but whether the individual engages at all.'
    },
    {
      id: 'w2', type: 'Task 2', typeCn: '议论文', time: 40, minWords: 250,
      prompt: 'Some experts believe that it is better for children to begin learning a foreign language at primary school rather than secondary school. Do the advantages outweigh the disadvantages?',
      promptCn: '有专家认为儿童最好在小学而非中学开始学外语。利是否大于弊？',
      outline: ['开头：明确立场——利明显大于弊', '利 1：年龄小，对语音语调敏感，发音更接近母语者', '利 2：不怕开口，语感与信心强；日后可作为学其他科目的工具', '弊：小学教师语言能力可能不足；挤占母语/数学时间；低质量周课效果差', '反驳：这些是实施层面的问题，可用师资培训解决，不影响原则', '结尾：重申立场 + 条件句'],
      model: 'Language learning has become a priority in many education systems, and some educators argue that foreign-language instruction should start in primary school rather than waiting until secondary education. I believe the advantages of an early start clearly outweigh the drawbacks.\n\nThe main benefit is that young children acquire languages with apparent ease. At primary age the brain is especially sensitive to sound and intonation, so pupils tend to develop near-native pronunciation and an intuitive sense of grammar, whereas secondary students often learn through translation and memorisation. Young children also feel less self-conscious about speaking aloud, which builds fluency and confidence. Furthermore, with several years of regular exposure, the language can later be used as a medium for studying other subjects rather than remaining an abstract system on a timetable.\n\nHowever, early language teaching is not without problems. Primary teachers may lack sufficient language training themselves, and introducing another subject can reduce time spent on the mother tongue and mathematics. Critics also point out that a poorly taught weekly lesson can leave children with little more than a handful of songs, while a well-designed secondary programme may overtake it within two years. These risks are real, but they concern implementation rather than the principle itself.\n\nIn conclusion, provided that primary schools employ suitably trained teachers and integrate languages into daily routines, an early start offers genuine and lasting advantages. The drawbacks can be managed through teacher training, whereas the gifts of an early start — authentic pronunciation and lasting confidence — become much harder to acquire later.'
    },
    {
      id: 'w3', type: 'Task 2', typeCn: '议论文', time: 40, minWords: 250,
      prompt: 'In many countries, the amount of crime committed by young people is increasing. What are the causes of this trend, and what solutions can be suggested?',
      promptCn: '在许多国家，青少年犯罪数量正在上升。原因是什么？可以提出哪些解决办法？',
      outline: ['开头：改写题目 + 预告（家庭与媒体两大原因，教育与社区方案）', '原因 1：家庭结构变化，缺少监管与榜样，放学后无人看管', '原因 2：网络与游戏中的暴力、物质攀比，相对剥夺感', '方案 1：学校与家长项目（课后托管、育儿指导）', '方案 2：媒体分级 + 为弱势青年提供导师、体育与就业项目', '结尾：总结，强调预防优于惩罚'],
      model: 'In many countries, offences committed by teenagers are rising faster than crime overall. This worrying trend has several causes, but two stand out: changes in family life and the influence of modern media. Fortunately, there are practical measures that communities can take to reverse it.\n\nThe first cause lies at home. As more parents work long hours, and as single-parent households become common, many teenagers spend their afternoons without adult supervision. A child who returns to an empty house every day receives little guidance, and minor misbehaviour can gradually escalate into something more serious. The second cause is the media environment. Violent content in games and films can normalise aggression, while social media constantly displays luxury goods, creating a sense of relative deprivation in young people who cannot afford them. Some turn to theft or gang membership to gain the status they feel denied.\n\nThe solutions must address both causes. Schools and local authorities could fund after-school clubs and sports programmes, so that teenagers have somewhere structured to go and positive role models to follow. Parenting classes, offered free to struggling families, would also help. For those already in trouble, mentoring schemes that pair young offenders with trained adults have been shown to reduce reoffending far more effectively than short prison sentences. Finally, governments should enforce age ratings on violent games and require platforms to limit advertising aimed at children.\n\nIn conclusion, youth crime is driven mainly by weakened family supervision and a media culture that glamourises both violence and wealth. Punishment alone will not fix these conditions; investment in education, supervision and mentoring offers a far better hope of change.'
    },
    {
      id: 'w4', type: 'Task 2', typeCn: '议论文', time: 40, minWords: 250,
      prompt: 'Some people believe that advances in technology make people socially isolated, while others argue that technology brings people closer. Discuss both these views and give your own opinion.',
      promptCn: '有人认为技术进步让人社交孤立，也有人认为技术让人更亲近。讨论双方并给出你的观点。',
      outline: ['开头：引出争议，预告', '孤立一方：线上交流取代面对面，餐桌低头族，算法回音室，浅层关系', '亲近一方：异地家人视频、兴趣社群、疫情期间维持联系', '自己观点：技术本身中性，取决于使用方式；有意识使用可兼顾', '结尾：重申'],
      model: 'Few inventions have changed human relationships as quickly as the smartphone. While some argue that modern technology isolates people from one another, others insist it has never been easier to stay connected. Both views contain some truth, and in my opinion the outcome depends less on the technology than on how deliberately it is used.\n\nThose who blame technology for loneliness have strong evidence. Online interaction increasingly replaces face-to-face contact: colleagues message each other from adjacent desks, and families sit at the same table staring at separate screens. Moreover, social media offers a shallow substitute for friendship — hundreds of online contacts cannot provide the comfort of one real conversation. Algorithms make matters worse by feeding users content similar to what they already like, trapping them in echo chambers and narrowing their contact with different people and ideas.\n\nOn the other hand, technology has undeniably brought many people closer. Video calls allow grandparents to watch their grandchildren grow up on another continent, something unimaginable a generation ago. Online communities connect people with rare hobbies or health conditions who might otherwise feel completely alone. During the recent pandemic, it was technology that kept classrooms, offices and friendships functioning at all. For the shy or the geographically isolated, digital contact is not a replacement for relationships but often their only lifeline.\n\nIn my view, technology itself is neutral; it amplifies the intentions of its user. Someone who uses messaging apps to arrange real meetings grows closer to their friends, while someone who scrolls endlessly alone does not. The solution is therefore not to reject technology but to use it consciously — as a bridge to human contact rather than a substitute for it.\n\nIn conclusion, technology can isolate or connect, and it frequently does both in the same household. Whether it brings us closer depends on choices that remain firmly in human hands.'
    },
    {
      id: 't1', type: 'Task 1', typeCn: '图表小作文', time: 20, minWords: 150,
      prompt: 'The table below gives information about changes in modes of travel in England between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      promptCn: '下表显示 2000 至 2020 年英格兰出行方式的变化。选取主要特征进行总结并作相关比较。',
      table: {
        caption: 'Average distance travelled per person per year (miles), by mode of travel',
        head: ['Mode', '2000', '2020'],
        rows: [
          ['Car driver', '3,200', '3,650'],
          ['Car passenger', '1,900', '1,450'],
          ['Local bus', '420', '280'],
          ['Train', '380', '720'],
          ['Walking', '260', '210'],
          ['Bicycle', '50', '90']
        ]
      },
      outline: ['总览：驾车仍占主导；铁路大增、公交下滑', '对比：自驾升、乘车降；火车近乎翻倍', '慢行交通：步行略降、自行车基数最小但近翻倍', '时态：一般过去时/过去时间段；单位 miles per person per year'],
      model: 'The table shows how the average distance travelled per person per year in England changed across six modes of transport between 2000 and 2020. Overall, car travel remained dominant throughout the period, while rail use grew substantially and local bus journeys declined.\n\nIn 2000, travelling as a car driver accounted for 3,200 miles per person per year, and this figure rose to 3,650 miles by 2020. By contrast, journeys made as a car passenger fell from 1,900 to 1,450 miles. The most striking increase was in train travel, which nearly doubled from 380 to 720 miles, making rail the third most common mode by the end of the two decades. Local bus use, meanwhile, declined by roughly a third, from 420 to 280 miles.\n\nActive forms of travel showed mixed trends. Walking decreased slightly, from 260 to 210 miles, whereas cycling rose, although it remained by far the least popular method, nearly doubling from just 50 miles to 90.\n\nTo sum up, English travellers relied increasingly on driving themselves and on trains between 2000 and 2020, while riding as passengers, taking buses and walking all became less common.'
    },
    {
      id: 't2', type: 'Task 1', typeCn: '折线图小作文', time: 20, minWords: 150,
      prompt: 'The line graph below shows the percentage of electricity generated from renewable sources in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      promptCn: '下图显示 2000–2020 年三个国家可再生能源发电占比的变化。选取主要特征进行总结并作相关比较。（数据以表格呈现）',
      table: {
        caption: 'Electricity from renewable sources (% of total generation)',
        head: ['Country', '2000', '2005', '2010', '2015', '2020'],
        rows: [
          ['Germany', '6', '10', '17', '29', '42'],
          ['United Kingdom', '3', '4', '7', '25', '41'],
          ['Japan', '3', '4', '4', '6', '9']
        ]
      },
      outline: ['总览：三国均上升；德英涨幅巨大并几乎持平，日本增长缓慢、明显落后', '德国：持续稳定上升 6→42', '英国：前十缓升，2010 后猛增 7→41，2020 与德国几乎相同', '日本：几乎停滞 3→9', '注意：用百分比描述；趋势词 surge/overtake/level off'],
      model: 'The chart compares the proportion of electricity produced from renewable sources in Germany, the United Kingdom and Japan over a twenty-year period. Overall, all three countries increased their share of renewable generation, but the rises in Germany and the UK were dramatic, while progress in Japan was modest.\n\nGermany began the period with the highest figure, at 6% in 2000, and its share grew steadily throughout, reaching 17% in 2010 and finishing at 42% in 2020. The United Kingdom followed a very different path. Its share rose only slightly during the first decade, from 3% to 7%, but then surged to 25% in 2015 and 41% in 2020, almost catching up with Germany by the end of the period.\n\nJapan, in contrast, made far slower progress. Starting at 3%, the same as the UK, its renewable share remained almost flat until 2010 and then climbed only gradually, standing at just 9% in 2020.\n\nIn summary, although the two European countries ended the period with strikingly similar figures, at around 42%, Japan lagged far behind, with less than a quarter of their level.'
    },
    {
      id: 't3', type: 'Task 1', typeCn: '柱状图小作文', time: 20, minWords: 150,
      prompt: 'The bar chart below compares the percentage of household spending on four categories in Country A and Country B in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      promptCn: '下图比较 2020 年 A、B 两国家庭在四类消费上的支出占比。选取主要特征进行总结并作相关比较。（数据以表格呈现）',
      table: {
        caption: 'Household spending by category (% of total), 2020',
        head: ['Category', 'Country A', 'Country B'],
        rows: [
          ['Housing', '32', '25'],
          ['Food', '18', '22'],
          ['Transport', '15', '10'],
          ['Leisure', '9', '14']
        ]
      },
      outline: ['总览：两国最大的开支都是住房与食品；A 国更重住房与交通，B 国更重食品与休闲', '住房：A 32% 高于 B 25%', '食品：B 22% 略高于 A 18%', '交通与休闲：A 交通高（15 vs 10），B 休闲高（14 vs 9）', '句型：whereas / while / by contrast 的对比结构'],
      model: 'The chart gives information about how households in Country A and Country B divided their spending across four categories in 2020. Overall, housing and food were the two largest expenses in both countries, although Country A devoted more to housing and transport, while Country B spent a greater share on food and leisure.\n\nHousing was the biggest category in Country A, accounting for 32% of total spending, considerably higher than the 25% recorded in Country B. The pattern for food was reversed: households in Country B spent 22% of their budget on food, compared with 18% in Country A.\n\nThe two smaller categories show similar contrasts. Transport absorbed 15% of spending in Country A, half as much again as the 10% in Country B. Leisure, by contrast, was a bigger priority in Country B, where it made up 14% of household budgets, five percentage points higher than the figure for Country A.\n\nIn summary, while the overall ranking of categories was broadly similar in the two nations, Country A’s households directed more of their money towards housing and getting around, whereas those in Country B spent proportionally more on eating and free time.'
    }
  ];

  /* ============ 五、口语题库 ============ */
  var SPEAKING = {
    part1: [
      {
        topic: 'Morning time 早晨', icon: '☀',
        items: [
          { q: 'Do you usually do the same things in the mornings?', a: 'More or less. I always start with a glass of water and a quick look at the news, though on weekends I allow myself a much slower start.' },
          { q: 'Do you think breakfast is important?', a: 'Definitely. Without breakfast I find it hard to concentrate by mid-morning, so I usually have eggs or porridge.' },
          { q: 'Are mornings your favourite part of the day?', a: 'Not really — I’m more of an evening person. I feel most focused later in the day.' }
        ]
      },
      {
        topic: 'Apps 手机应用', icon: '▦',
        items: [
          { q: 'What kinds of apps are most popular in your country?', a: 'Messaging and payment apps, without doubt. Most people use their phone to chat and even to pay at street stalls.' },
          { q: 'How much time do you spend on apps?', a: 'Probably around three hours a day, which sounds excessive, although quite a lot of that is work-related.' },
          { q: 'Have you ever used an app to learn something?', a: 'Yes, I use a vocabulary app for English. Spending five minutes on new words during my commute has become a habit.' }
        ]
      },
      {
        topic: 'Reading 阅读', icon: '✎',
        items: [
          { q: 'Do you like reading?', a: 'I do, although these days I read more articles online than full-length books.' },
          { q: 'Did you enjoy reading when you were a child?', a: 'Very much. My parents read to me every night, and I loved adventure stories in particular.' },
          { q: 'Do you prefer paper books or e-books?', a: 'For studying I prefer e-books because of the built-in dictionaries, but fiction still feels better on paper.' }
        ]
      },
      {
        topic: 'Music 音乐', icon: '♪',
        items: [
          { q: 'Do you often listen to music?', a: 'Almost every day, usually while I’m commuting or cooking. It makes boring routines much more bearable.' },
          { q: 'What kind of music do you like?', a: 'Mostly pop and film soundtracks. When I need to concentrate, though, I switch to instrumental music without lyrics.' },
          { q: 'Did you learn a musical instrument as a child?', a: 'I had piano lessons for two years, but I gave up, which I slightly regret now. I’ve been thinking about picking it up again.' }
        ]
      },
      {
        topic: 'Weather 天气', icon: '☁',
        items: [
          { q: 'What’s the weather like in your hometown?', a: 'We have four distinct seasons. Summers are hot and humid, while winters are cold but rarely below freezing.' },
          { q: 'Do you prefer hot or cold weather?', a: 'Cold, definitely. You can always put on another layer, but there’s a limit to what you can do about heat.' },
          { q: 'Does the weather affect your mood?', a: 'Very much so. A string of grey, rainy days makes everyone in my family a little quieter, and sunshine lifts us instantly.' }
        ]
      }
    ],
    part2: [
      {
        id: 's1', cue: 'Describe a useful app that you use often.',
        bullets: ['what the app is', 'how you found out about it', 'what you use it for', 'and explain why you find it so useful'],
        model: 'I’d like to talk about a vocabulary app I’ve been using for about a year. A classmate recommended it to me when I started preparing for IELTS.\n\nThe app presents words as flashcards. Each card has the pronunciation, an example sentence and the Chinese meaning, and it uses a spaced-repetition system, so difficult words come back more often while easy ones fade out. I mainly use it on my commute, for about ten minutes a day. It also sends a reminder if I miss a day, which is slightly annoying but genuinely useful.\n\nWhat I like most is that it turns something quite stressful into a small daily game. I can really feel the difference now when I read English articles — far fewer words send me to a dictionary. The basic content is free as well, which suits a student budget. So it has become one of the very few apps on my phone that has actually changed a habit of mine.'
      },
      {
        id: 's2', cue: 'Describe a book that you have read recently.',
        bullets: ['what book it was', 'when you read it', 'what it was about', 'and explain how you felt about it'],
        model: 'I recently finished a popular science book about sleep. I read it last winter, mostly before going to bed, which felt quite fitting.\n\nThe book explains what happens in the brain during deep sleep and dreaming, and the author argues that sleep is just as important as diet and exercise. I found some chapters genuinely alarming, especially the part about people who regularly sleep less than six hours. It actually changed my routine: I now avoid coffee after lunch and try to keep regular sleeping hours. My only criticism is that the book repeats its main message a little too often.\n\nEven so, it’s the first non-fiction book in years that I recommended to three different friends. It was informative without feeling like a textbook, and it made me treat sleep as a skill rather than a waste of time.'
      },
      {
        id: 's3', cue: 'Describe a place where you would like to spend a holiday.',
        bullets: ['where it would be', 'how you got to know about it', 'what you would like to do there', 'and explain why you want to visit this place'],
        model: 'If I could choose anywhere, I’d love to spend a holiday in Iceland. I first saw it in a travel documentary and the images just stayed with me.\n\nWhat attracts me is that the landscape looks completely unlike anywhere else — volcanoes, glaciers, black sand beaches and, hopefully, the northern lights. I’d go in late winter, hire a small car and drive part of the ring road at a slow pace. I’m also keen to bathe in a natural hot spring after a day in the cold.\n\nThe reason I want to go is partly the scenery and partly the pace. There are no huge cities to rush through, so it feels like a proper escape. It is expensive, which is why I’m saving for it, and I know the weather could disrupt my plans — but honestly, a little uncertainty is part of the appeal.'
      },
      {
        id: 's4', cue: 'Describe a skill that you would like to learn.',
        bullets: ['what skill it is', 'how you would learn it', 'why it is difficult to learn', 'and explain why you want to learn it'],
        model: 'A skill I’d really like to improve is public speaking. At university I can give presentations, but I always speak too quickly and avoid eye contact with the audience.\n\nMy plan would be to join a debating or public-speaking club and record myself once a week, then watch the recordings back to spot bad habits. I’d also study strong speakers online and copy their pacing rather than their words. I know it will take months rather than days.\n\nThe reason it matters goes beyond work. Being able to speak calmly in front of people helps at conferences, weddings, almost everything. For me the barrier is not vocabulary — it’s confidence, and I’ve noticed that confidence grows fastest when I force myself into slightly uncomfortable situations. That’s exactly why I want to tackle it.'
      },
      {
        id: 's5', cue: 'Describe a person who has inspired you.',
        bullets: ['who the person is', 'how you know about them', 'what they have done', 'and explain why they inspire you'],
        model: 'I’d like to talk about my high-school physics teacher, Mr Chen, who probably changed the direction of my life without realising it.\n\nI met him when I was fifteen and honestly quite a lazy student. What made him different was that he never blamed us for not understanding something — he blamed the explanation. If the class looked lost, he would stop, tell a story about how the same problem confused Einstein, and try again from another angle. He also ran a free Saturday morning session for anyone who wanted extra help, and he kept it going for years.\n\nWhat inspires me most is his patience combined with high standards. He believed every student could understand difficult ideas, but he never lowered the bar to make it easy. I failed his first test badly, and instead of criticism he wrote one sentence on my paper: “Not yet.” That idea — that failure just means “not yet” — is something I still repeat to myself.\n\nSo whenever I face something difficult now, I picture his classroom. He showed me that a good teacher doesn’t just teach a subject; they teach you what you’re capable of.'
      },
      {
        id: 's6', cue: 'Describe a journey you remember well.',
        bullets: ['where you went', 'how you travelled', 'who you were with', 'and explain why you remember it so well'],
        model: 'The journey I remember best is a train trip I took with my grandfather from our hometown to the coast, when I was about ten years old.\n\nIt was an old-fashioned slow train — the kind with windows you could actually open. The journey took nearly seven hours, which sounds boring, but my grandfather treated it as part of the holiday. He had packed a whole bag of food, and he knew the name of every river and mountain we passed. At one point it started to rain heavily, and I remember the smell of the wet fields coming through the window.\n\nWe talked the entire way. He told me stories about taking the same line as a young man, when the trip took twice as long. I think that was the first time I saw him not just as my grandfather but as a person with his own adventures.\n\nThe reason the journey stays with me is that it taught me travelling slowly can be better than arriving quickly. We barely remember the beach itself, but I could describe that train carriage in detail twenty years later.'
      },
      {
        id: 's7', cue: 'Describe a quiet place you like to go to.',
        bullets: ['where it is', 'how often you go there', 'what you do there', 'and explain why you like it'],
        model: 'My quiet place is a small public library about fifteen minutes’ walk from where I live. It’s not famous or beautiful — just an ordinary building from the 1980s — but the reading room on the second floor has become my refuge.\n\nI go there roughly twice a week, usually in the early evening. There’s a corner table near the window that regular visitors seem to leave for each other. Sometimes I study there, but often I just read something unrelated to work, or sit and think. The only sounds are pages turning and the occasional soft cough, which somehow feels more peaceful than total silence.\n\nWhat I value most is that the library gives me permission to slow down. At home there’s always laundry, messages, a screen asking for attention. In that reading room, nobody expects anything from me for an hour or two.\n\nI think everyone needs a “third place” that is neither home nor work, and I feel genuinely lucky that mine is free, warm and full of books.'
      },
      {
        id: 's8', cue: 'Describe an old object you have kept for a long time.',
        bullets: ['what the object is', 'how long you have had it', 'what you use it for', 'and explain why you have kept it'],
        model: 'The oldest thing I own is a mechanical alarm clock that belonged to my grandmother. It’s a small round clock with two metal bells on top, and you have to wind it up every night by hand.\n\nMy grandmother gave it to me when I left home for university, about eight years ago. She had used it her whole working life — she was a nurse and could never be late for a shift. I still use it today, actually, because keeping my phone out of the bedroom has noticeably improved my sleep. The ticking is quite loud, but I found I got used to it within a week, and now I find it strangely comforting.\n\nThe clock has survived three flat moves and one drop from a desk, and it still keeps almost perfect time, which amazes me. Modern gadgets feel disposable by comparison.\n\nI keep it partly because it works, but mostly because of what it represents: reliability, routine, and my grandmother’s quiet discipline. It’s the first thing I’d rescue from a fire, and it cost almost nothing.'
      }
    ],
    part3: [
      { q: 'Why do many adults find it difficult to learn new skills?', tips: ['工作后整段时间少、精力被家务切分', '怕在同龄人面前显得笨拙（fear of looking foolish）', '误以为成年后大脑不再“可塑”', '优质课程往往价格不菲'] },
      { q: 'Should governments pay for adult education?', tips: ['应该：提升生产率、降低失业、缩小不平等', '纳税人负担与预算竞争的反对意见', '回应：长期回报（税收、减少福利支出）大于短期投入'] },
      { q: 'How has technology changed the way people learn?', tips: ['随时随地、可回放、个性化进度', '免费资源（MOOC/视频）民主化', '缺点：缺乏自律则完课率低；信息质量参差、错误内容多'] },
      { q: 'Do schools prepare students well for the modern workplace?', tips: ['知识扎实，但软技能（协作、表达、应变）训练不足', '技术变化快于课程更新', '考试文化鼓励标准答案，而工作要求开放式解决问题'] },
      { q: 'Why is lifelong learning more important now than in the past?', tips: ['自动化使岗位技能半衰期变短', '一生可能换 5–7 份职业', '寿命延长，退休后仍需保持认知活跃'] },
      { q: 'Is it better to learn a skill alone or in a group?', tips: ['独自：节奏自由、可专注深层内容', '小组：有反馈、有同伴压力、模拟真实互动', '结论依技能类型而定（编程可自学，演讲必须在人前练）'] },
      { q: 'How does tourism affect local communities?', tips: ['积极：就业、基础设施改善、传统工艺复兴', '消极：物价上涨、拥挤、文化被“表演化”', '平衡：社区参与决策、限制客流、让收益留在本地'] },
      { q: 'Is it better to give practical gifts or memorable ones?', tips: ['实用：被真正使用、不浪费', '有纪念意义：情感价值、承载共同回忆', '结论：取决于关系亲疏；最好的礼物往往两者兼具'] },
      { q: 'Why do people keep objects they no longer use?', tips: ['情感依附（sentimental value）：物品=记忆载体', '“万一哪天用得上”的心理', '断舍离观点：物品占据空间也占据注意力'] },
      { q: 'Do you think cities are becoming too noisy?', tips: ['交通与施工噪声增加，密度上升', '噪声的健康影响：睡眠、压力、儿童学习', '对策：限行低噪区、建筑隔音标准、绿地缓冲'] }
    ]
  };

  var TIPS = [
    '写作先花 5 分钟列提纲，观点质量决定分数上限。',
    '听力数字、日期、拼写是送分题，也是最容易丢分的地方。',
    '口语 Part 2 用“过去—现在—感受”三段式能自然说满两分钟。',
    '阅读 T/F/NG：出现明确相反信息才是 FALSE，没提到一律 NOT GIVEN。',
    '每天 15 分钟碎片词汇，比周末一次背 3 小时更有效。',
    '小作文第一段永远写 overall，考官按结构找观点。',
    '口语宁可简单而流利，不要复杂而卡顿。',
    '阅读先看题目划定位词，再回原文扫读，不要逐字翻译。',
    '写作检查时重点盯第三人称单数、时态和冠词。',
    '听力注意答案字数限制，超过 NO MORE THAN TWO WORDS 直接算错。',
    '同义替换是雅思的底层逻辑：听力阅读的正确答案几乎都是原文的改写。',
    '口语 Part 3 用「观点—原因—例子—让步」四步展开，立刻显得有层次。',
    '图表作文先找最高值、最低值和趋势反转点，再动笔。',
    '背单词每天新词与复习各半，遗忘曲线决定复习比新学更重要。',
    '听力填空先预判词性：空前是 a/an 必为单数名词，是 the 后面常跟名词。'
  ];

  /* ============ 六、同义替换（Paraphrase）24 组 ============ */
  // 选出与原句意思最接近的改写；陷阱类型：偷换主语/因果、过度绝对、细节失真
  var P = function (orig, opts, a, why) { return { orig: orig, opts: opts, a: a, why: why }; };
  var PARAPHRASE = [
    P('The city council has banned private cars from the centre.',
      ['Private cars are no longer allowed in the city centre.', 'The council plans to build a car park in the centre.', 'Private cars are charged a fee to enter the centre.', 'All vehicles are permanently banned from the city.'], 0,
      'banned…from = no longer allowed；C 把「禁止」偷换为「收费」；D 的 all vehicles 与 permanently 过度绝对。'),
    P('Children who read every day tend to do better at school.',
      ['Daily reading is linked to better academic performance in children.', 'Children must read every day to enter a good school.', 'School children read more than ever before.', 'Good students force their children to read daily.'], 0,
      'tend to do better at school → linked to better academic performance；B/D 把相关性偷换为强制，C 比较对象失真。'),
    P('The scheme collapsed because it ran out of money.',
      ['The scheme collapsed so it ran out of money.', 'A lack of funding caused the scheme to fail.', 'The scheme lent all its money to others.', 'Money problems made the scheme more popular.'], 1,
      'ran out of money = a lack of funding，collapsed = fail；A 颠倒了因果。'),
    P('More and more people are choosing to work from home.',
      ['People have no choice but to work from home.', 'Homework is becoming harder for students.', 'Working remotely has become increasingly common.', 'Most people refuse to work in offices.'], 2,
      'more and more → increasingly common；A 把「选择」偷换为「被迫」，D 的 refuse 无中生有。'),
    P('The new law will take effect next January.',
      ['The new law was passed last January.', 'The new law will be abolished next January.', 'The new law applies only from January onwards.', 'The new law will start to be applied next January.'], 3,
      'take effect = start to be applied；C 的 only from…onwards 排除了以后，属于细节失真。'),
    P('Regular exercise reduces the risk of heart disease.',
      ['Heart disease can be cured by regular exercise.', 'People who exercise regularly are less likely to develop heart disease.', 'Exercise is risky for people with heart disease.', 'Only regular exercise can prevent heart disease.'], 1,
      'reduces the risk = less likely to develop；A 的 cured 与 D 的 only…prevent 都过度绝对。'),
    P('Fewer than half of the students passed the exam.',
      ['Half of the students passed the exam.', 'More than half of the students failed the exam.', 'All of the students found the exam easy.', 'Few students took the exam seriously.'], 1,
      'fewer than half passed → 多数没过 = more than half failed；A 把「不足一半」改成「恰好一半」。'),
    P('The company blamed the delay on a shortage of parts.',
      ['A shortage of parts delayed the company’s products.', 'The company delayed the shortage of parts.', 'Parts were blamed for closing the company.', 'The company apologised for delivering parts early.'], 0,
      'blamed the delay on X → X caused the delay；B 颠倒主宾，C/D 无中生有。'),
    P('Online shopping has overtaken traditional retail in popularity.',
      ['Traditional shops are now more popular than online shops.', 'Online shopping has closed all traditional retail stores.', 'Online shopping is now more popular than traditional retail.', 'Traditional retail has overtaken online shopping.'], 2,
      'A has overtaken B in popularity → A is now more popular than B；D 方向相反。'),
    P('The museum’s collection is second to none in the region.',
      ['The museum has the finest collection in the region.', 'The museum’s collection is the second best nearby.', 'The region has no museums at all.', 'The collection was moved to a second museum.'], 0,
      '习语 second to none = 首屈一指 = the finest；B 按字面误读为「第二」。'),
    P('It is widely believed that sleep affects memory.',
      ['Scientists have proved sleep has no effect on memory.', 'Many people think that sleep influences memory.', 'Memory affects sleep more than sleep affects memory.', 'Everyone believes sleep only affects memory.'], 1,
      'it is widely believed = many people think；A 与 C 含义相反，D 的 only 过度绝对。'),
    P('The bridge, which was built in 1890, is still in use.',
      ['The bridge was rebuilt in 1890 and later closed.', 'The bridge has been used since 1890.', 'People stopped using the bridge in 1890.', 'The bridge will be built in 1890.'], 1,
      'built in 1890 + still in use → 自 1890 年沿用至今；A/C/D 均与原意矛盾或时态错乱。'),
    P('Prices rose sharply at the beginning of the year but have since levelled off.',
      ['Prices are still rising as sharply as before.', 'Prices fell sharply at the start of the year.', 'After a sharp early rise, prices have stabilised.', 'Prices have never changed this year.'], 2,
      'levelled off = stabilised（趋稳）；A 说仍在猛涨，B 把涨偷换为跌。'),
    P('The report attributes the decline in bees to pesticide use.',
      ['Pesticides are declining because of bees.', 'The report says pesticide use is responsible for fewer bees.', 'Bees are blamed for the decline in pesticides.', 'The report denies pesticides harm bees.'], 1,
      'attributes X to Y = 认为 Y 导致 X（Y is responsible for X）；A/C 颠倒因果，D 相反。'),
    P('Not until the 1980s did personal computers become affordable.',
      ['Personal computers were cheap long before the 1980s.', 'Personal computers only became affordable in the 1980s.', 'Personal computers have never been affordable.', 'In the 1980s people stopped buying computers.'], 1,
      'not until X did Y = only in X did Y；A/D 与原意相反，C 过度绝对。'),
    P('The festival attracts visitors from all over the world.',
      ['Only local people attend the festival.', 'The festival sends visitors around the world.', 'People come to the festival from many countries.', 'The festival is held in a different world each year.'], 2,
      'from all over the world = from many countries；A 相反，B 偷换主语方向。'),
    P('He found the lecture so boring that he could hardly stay awake.',
      ['He stayed awake because the lecture was exciting.', 'The lecture was too interesting for him to sleep.', 'He nearly fell asleep during the boring lecture.', 'He slept through the lecture because it was exciting.'], 2,
      'so boring that…hardly stay awake = nearly fell asleep；A/B/D 把 boring 偷换成 exciting。'),
    P('Renewable energy is expected to account for half of all power by 2040.',
      ['Renewables will provide about 50% of power by 2040.', 'Half of all power plants will close by 2040.', 'Renewable energy already provides most power.', 'Power will be free by 2040 thanks to renewables.'], 0,
      'account for half = provide about 50%；B 偷换为「电厂关闭」，C 时态错误。'),
    P('The manager turned a blind eye to the minor mistake.',
      ['The manager could not see the mistake because of poor eyesight.', 'The manager pretended not to notice the minor mistake.', 'The manager punished the minor mistake severely.', 'The manager’s eye was injured by a mistake.'], 1,
      '习语 turn a blind eye to = 睁一只眼闭一只眼 = pretended not to notice。'),
    P('What matters is not how much you practise, but how you practise.',
      ['The amount of practice matters more than the method.', 'Practice method is more important than practice quantity.', 'You should neither practise much nor practise well.', 'How much you practise matters most of all.'], 1,
      'not A but B 结构：B（how/method）才是关键；A/D 取反了重点。'),
    P('The two sisters bear a striking resemblance to each other.',
      ['The two sisters look remarkably alike.', 'The two sisters rarely see each other.', 'The two sisters strike each other.', 'The two sisters resemble nobody in the family.'], 0,
      'bear a striking resemblance = look remarkably alike（长得极像）；C 按字面误读 strike。'),
    P('Owing to the heavy rain, the match was called off.',
      ['The match was postponed because of heavy rain.', 'The match was cancelled because of heavy rain.', 'Heavy rain was caused by the cancelled match.', 'The match continued despite the heavy rain.'], 1,
      'called off = cancelled（取消）；A 的 postponed 是「延期再办」，called off 不含改期之意，属细节失真。'),
    P('The new policy is aimed at reducing traffic congestion.',
      ['The policy aims to make traffic jams less severe.', 'The policy has successfully reduced all congestion.', 'Traffic congestion is aimed at the new policy.', 'The policy was reduced by traffic congestion.'], 0,
      'is aimed at reducing = aims to make…less severe；B 的 has successfully…all 把目标说成既成事实且过度绝对。'),
    P('Hardly had the concert begun when the power failed.',
      ['The concert began after the power failed.', 'The power failed just as the concert was starting.', 'The concert had no power problems at all.', 'The power failed long before the concert began.'], 1,
      'hardly had…when = 一……就……（刚开始就停电）；A/D 时序相反，C 无中生有。')
  ];



  /* ---------------- 篇章听力：对话（生活场景）+ 短文讲座（学术） ----------------
     每篇 3 道选择题；dialogue 用 turns（A/B 轮流朗读），lecture 用 paragraphs */
  var LISTEN_PARTS = [    {
      type: 'dialogue', level: 1, scene: 'Section 1 · 住宿咨询',
      title: 'Renting a Flat 租房咨询',
      turns: [
        { who: 'A', text: 'Good morning, City Lets. How can I help you?' },
        { who: 'B', text: 'Hi, I am looking for a one-bedroom flat near the university. What do you have available?' },
        { who: 'A', text: 'We have two options at the moment. The first is on Park Road, about ten minutes on foot from campus, at six hundred and fifty pounds per month.' },
        { who: 'B', text: 'Does that include bills?' },
        { who: 'A', text: 'Water is included, but electricity and internet are separate. The second flat is on Queen Street, slightly cheaper at five hundred and ninety, but you would need to take the number twenty-three bus, which takes about twenty minutes.' },
        { who: 'B', text: 'I see. And when would the Park Road flat be available?' },
        { who: 'A', text: "From the first of September. There is also a deposit of one month's rent, which is refundable at the end of the tenancy." },
        { who: 'B', text: 'That sounds reasonable. Could I arrange a viewing this Thursday afternoon?' }
      ],
      questions: [
        { q: 'How much is the monthly rent of the flat on Park Road?', opts: ['£590', '£615', '£650', '£750'], ans: 2, why: '中介明确说 Park Road 的房租是 six hundred and fifty pounds per month。' },
        { q: 'What is included in the Park Road rent?', opts: ['All bills', 'Water only', 'Electricity only', 'Internet only'], ans: 1, why: 'Water is included, but electricity and internet are separate —— 只包水费。' },
        { q: 'How would the student travel to campus from the Queen Street flat?', opts: ['On foot', 'By the number 23 bus', 'By the number 32 bus', 'By bicycle'], ans: 1, why: 'take the number twenty-three bus，约 20 分钟；数字干扰是雅思常考陷阱。' }
      ]
    },
    {
      type: 'dialogue', level: 1, scene: 'Section 1 · 会员办理',
      title: 'Sports Centre Membership 健身中心入会',
      turns: [
        { who: 'A', text: 'Hello, welcome to Riverside Sports Centre. Are you interested in becoming a member?' },
        { who: 'B', text: 'Yes, I have just moved to the area. What types of membership do you offer?' },
        { who: 'A', text: 'There are three. The basic plan is thirty pounds a month and covers the gym only. The standard plan is forty-five and adds the swimming pool. The premium plan, at sixty pounds, includes all classes, such as yoga and spinning, plus a free personal training session every month.' },
        { who: 'B', text: 'I mainly want to swim. Is the pool open every day?' },
        { who: 'A', text: "Every day except Tuesday, when it is closed for cleaning. On weekdays it opens at six thirty in the morning, and at weekends from eight o'clock." },
        { who: 'B', text: 'And is there a joining fee?' },
        { who: 'A', text: 'Normally twenty-five pounds, but we are running a promotion this month, so if you sign up before Friday, the fee is waived.' },
        { who: 'B', text: 'Great. I will take the standard plan then. Can I register online?' }
      ],
      questions: [
        { q: 'Which membership plan includes fitness classes?', opts: ['Basic', 'Standard', 'Premium', 'All plans'], ans: 2, why: 'only the premium plan (sixty pounds) includes all classes。' },
        { q: 'When is the swimming pool closed?', opts: ['Monday', 'Tuesday', 'Friday', 'Sunday'], ans: 1, why: 'Every day except Tuesday, when it is closed for cleaning。' },
        { q: 'How can the joining fee be avoided?', opts: ['Pay for a full year', 'Sign up before Friday', 'Choose the basic plan', 'Register online'], ans: 1, why: '本月促销：Friday 前签约免 joining fee（waived = 免除）。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 1 · 旅行咨询',
      title: 'Booking a Coach Tour 旅行社团游',
      turns: [
        { who: 'A', text: 'Good afternoon, Highland Tours. What can I do for you?' },
        { who: 'B', text: 'I would like some information about your day trips to the Lake District.' },
        { who: 'A', text: 'Of course. We run two tours. The scenic tour leaves at nine in the morning and returns at six, priced at fifty-eight pounds, which includes a boat cruise on Lake Windermere.' },
        { who: 'B', text: 'And the other one?' },
        { who: 'A', text: 'The hiking tour is more active. It departs earlier, at seven forty-five, and costs forty-six pounds. Lunch is not provided on that one, so you would need to bring a packed lunch.' },
        { who: 'B', text: 'Is there a discount for students?' },
        { who: 'A', text: 'Yes, ten percent off with a valid student card, but only for bookings made at least three days in advance.' },
        { who: 'B', text: 'Understood. One last thing: where does the coach leave from?' },
        { who: 'A', text: 'It used to leave from the bus station, but since March it departs from outside the city museum, on Victoria Street.' }
      ],
      questions: [
        { q: 'What is included in the scenic tour price?', opts: ['Lunch', 'A boat cruise', 'A museum ticket', 'Hotel pickup'], ans: 1, why: 'fifty-eight pounds 含 a boat cruise on Lake Windermere；午餐是 hiking tour 不含的。' },
        { q: 'What should hikers bring with them?', opts: ['A student card', 'A camera', 'A packed lunch', 'Walking boots'], ans: 2, why: 'Lunch is not provided…bring a packed lunch（自带便当）。' },
        { q: 'Where does the coach depart from now?', opts: ['The bus station', 'Outside the city museum', 'Victoria train station', 'The tourist office'], ans: 1, why: 'used to leave from the bus station（过去）→ now departs from outside the city museum。今昔对比是经典干扰项。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 1 · 兼职面试',
      title: 'Part-time Job Interview 兼职面试',
      turns: [
        { who: 'A', text: 'Thanks for coming in, Maria. You are applying for the weekend position at the bookshop, is that right?' },
        { who: 'B', text: 'Yes, that is correct. I am free on Saturdays and Sundays.' },
        { who: 'A', text: 'Good. The shop opens at nine, but staff arrive at eight thirty to set up. The pay is eleven pounds fifty an hour, rising to twelve after three months.' },
        { who: 'B', text: 'That sounds fine. What would my main duties be?' },
        { who: 'A', text: 'Mostly serving customers at the till and restocking shelves. You would not need to handle deliveries — that is the warehouse team\'s job.' },
        { who: 'B', text: 'I have some retail experience from a summer job at a clothes store.' },
        { who: 'A', text: 'Excellent. We also ask staff to work one evening every two weeks for stocktaking, on Wednesdays. Would that be a problem?' },
        { who: 'B', text: 'No, Wednesday evenings are fine for me.' },
        { who: 'A', text: 'Wonderful. We will contact you by email by the end of the week to let you know our decision.' }
      ],
      questions: [
        { q: 'What time must staff arrive at the shop?', opts: ['8:00', '8:30', '9:00', '9:30'], ans: 1, why: 'opens at nine, but staff arrive at eight thirty —— 开店时间与到岗时间的数字干扰。' },
        { q: 'Which duty is NOT part of the job?', opts: ['Serving customers', 'Restocking shelves', 'Handling deliveries', 'Stocktaking'], ans: 2, why: 'You would not need to handle deliveries —— 送/收货由 warehouse team 负责。' },
        { q: 'How will Maria receive the result?', opts: ['By phone', 'By letter', 'By email', 'In person'], ans: 2, why: 'We will contact you by email。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 海洋生物',
      title: 'Whale Shark Research 鲸鲨研究讲座',
      paragraphs: [
        'Today I want to talk about the whale shark, the largest fish in the ocean. Despite its name, it is a shark, not a whale, and despite reaching lengths of up to twelve metres, it feeds mainly on plankton, filtering enormous volumes of water through its gills.',
        "Until recently, studying whale sharks was extremely difficult because individuals were hard to track. That changed when researchers realised that the pattern of spots on each shark's skin is unique, much like a human fingerprint. Scientists now identify individuals using photographs submitted by divers around the world, a method known as photo-identification.",
        "The data gathered has revealed some surprises. Whale sharks can dive to depths of nearly two thousand metres, far deeper than previously believed. However, the species is now classified as endangered, mainly because of collisions with ships and accidental capture in fishing nets. Conservation programmes currently focus on shipping lanes that cross the sharks' main feeding areas."
      ],
      questions: [
        { q: 'What do whale sharks mainly eat?', opts: ['Small fish', 'Plankton', 'Seaweed', 'Squid'], ans: 1, why: 'feeds mainly on plankton（滤食浮游生物），体型与食性的反差是考点。' },
        { q: 'How do researchers identify individual whale sharks?', opts: ['Satellite tags', 'DNA samples', 'Spot patterns in photographs', 'Fin shapes'], ans: 2, why: 'spots 独一无二 like a fingerprint → photo-identification（照片识别法）。' },
        { q: 'Why is the whale shark endangered?', opts: ['Overfishing for food', 'Loss of coral reefs', 'Ship collisions and net capture', 'Climate change'], ans: 2, why: 'mainly because of collisions with ships and accidental capture in fishing nets。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 城市规划',
      title: 'Urban Cycling Networks 城市自行车道',
      paragraphs: [
        "In today's lecture, we will look at how cities design cycling networks. The first point to understand is that painted lanes, which simply mark a strip of road for cyclists, do little to increase cycling rates. Studies from several European cities show that physical separation between cyclists and motor traffic is the single most important factor in encouraging people to ride.",
        'The city of Copenhagen offers the classic example. Its cycle tracks are raised slightly above road level and separated from cars by a kerb. Junctions are redesigned so that cyclists have their own traffic signals, often given a green light a few seconds before cars, which dramatically reduces collisions at intersections.',
        'However, building such infrastructure is expensive. Cities with limited budgets have adopted a cheaper approach known as the low-traffic neighbourhood, where through traffic is removed from residential streets using barriers and planters. Early evidence suggests these schemes can double cycling on treated streets at a fraction of the cost of full cycle tracks.'
      ],
      questions: [
        { q: 'What most encourages people to cycle, according to the studies?', opts: ['Painted lanes', 'Physical separation from cars', 'Free bicycle schemes', 'Lower speed limits'], ans: 1, why: 'painted lanes…do little（弱干扰）→ physical separation is the single most important factor。' },
        { q: 'In Copenhagen, why do cyclists get a green light first?', opts: ['To let them park first', 'To reduce collisions at junctions', 'To avoid road repairs', 'To save travel time'], ans: 1, why: 'given a green light a few seconds before cars → dramatically reduces collisions at intersections。' },
        { q: 'What is a low-traffic neighbourhood?', opts: ['A zone banning all cyclists', 'A street with through traffic removed', 'A car-free city centre', 'A network of motorways'], ans: 1, why: 'through traffic is removed from residential streets using barriers and planters（低成本替代方案）。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 心理学',
      title: 'Sleep and Memory 睡眠与记忆',
      paragraphs: [
        'For decades, students have been told that staying up all night to study before an exam is a bad idea, and modern sleep research explains exactly why. Memory is not stored in one step; it is consolidated, meaning fragile short-term traces are converted into stable long-term storage, and much of this consolidation happens during sleep.',
        'Two stages of sleep play different roles. Deep, slow-wave sleep, which dominates the first half of the night, is essential for consolidating facts and events. REM sleep, the stage associated with dreaming, which is concentrated in the early morning hours, appears more important for skills and emotional memories.',
        "In one influential experiment, volunteers learned a list of word pairs in the evening. Half were then allowed a full night's sleep, while the other half stayed awake. When tested the next morning, the sleep group recalled, on average, twenty percent more word pairs. Interestingly, the benefit was greatest for words the volunteers had found hardest to learn, suggesting that sleep prioritises the most difficult material."
      ],
      questions: [
        { q: 'What does "consolidation" refer to?', opts: ['Forgetting useless memories', 'Converting short-term traces into long-term storage', 'Repeating information aloud', 'Dreaming about daily events'], ans: 1, why: 'consolidated = fragile short-term traces are converted into stable long-term storage。' },
        { q: 'Which sleep stage is linked to facts and events?', opts: ['REM sleep', 'Light sleep', 'Slow-wave sleep', 'The dreaming stage'], ans: 2, why: 'deep, slow-wave sleep…essential for consolidating facts；REM 对应技能与情绪记忆，属配对干扰。' },
        { q: 'In the experiment, which words benefited most from sleep?', opts: ['The easiest words', 'The longest words', 'The hardest words', 'The words learned first'], ans: 2, why: 'the benefit was greatest for words…hardest to learn —— sleep prioritises the most difficult material。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 博物馆学',
      title: 'Museum Collection Care 博物馆藏品管理',
      paragraphs: [
        'When you walk through a museum, you typically see less than ten percent of its collection. The rest is held in storage, and caring for those stored objects is a science in itself. The greatest threats are not theft or fire, but slow, invisible forces: light, humidity, and temperature.',
        'Light damage is cumulative and irreversible. For this reason, light-sensitive objects such as textiles and watercolours are displayed for limited periods — often three months — before being rested in darkness for several years. Storage areas, of course, are kept completely dark when not in use.',
        'Humidity control is equally critical. Most organic materials are kept at around fifty percent relative humidity. What matters even more than the exact figure, however, is stability. An object can adapt to slightly dry or slightly damp conditions, but rapid fluctuation causes materials to expand and contract, leading to cracks. Modern storage buildings therefore prioritise stable conditions over perfect numbers.'
      ],
      questions: [
        { q: 'What proportion of a museum collection is usually on display?', opts: ['About half', 'Around a quarter', 'Less than ten percent', 'Nearly all of it'], ans: 2, why: 'you typically see less than ten percent of its collection。' },
        { q: 'Why are watercolours displayed for limited periods?', opts: ['They are unpopular', 'Light damage is cumulative and irreversible', 'They need regular cleaning', 'Frames are expensive'], ans: 1, why: 'Light damage is cumulative and irreversible → 展出约三个月后入库避光休息数年。' },
        { q: 'What matters most in humidity control?', opts: ['Keeping it below fifty percent', 'Perfect daily records', 'Stability rather than exact figures', 'Rapid adjustment to seasons'], ans: 2, why: 'What matters even more than the exact figure is stability —— rapid fluctuation 才会导致开裂。' }
      ]
    },
{
      type: 'dialogue', level: 1, scene: 'Section 1 · 图书馆办卡',
      title: 'Library Membership 图书馆办卡',
      turns: [
        { who: 'A', text: 'Hello, I would like to join the library. How do I get a membership card?' },
        { who: 'B', text: 'Certainly. You can fill in the form here at the desk, or register online. Either way, you will need to collect the card in person.' },
        { who: 'A', text: 'How much does membership cost?' },
        { who: 'B', text: 'It used to be fifteen pounds a year, but since April it is twelve pounds for adults, and free for anyone under eighteen.' },
        { who: 'A', text: 'What should I bring to collect the card?' },
        { who: 'B', text: 'Two documents: one with your photograph, such as a passport or driving licence, and one showing your current address, for example a recent electricity bill.' },
        { who: 'A', text: 'Fine. And how many books can I borrow at a time?' },
        { who: 'B', text: 'Up to twelve items, including up to four DVDs. The loan period is three weeks, and you can renew online unless someone else has reserved the item.' }
      ],
      questions: [
        { q: 'What is the current annual membership fee for adults?', opts: ['It is free', '£12', '£15', '£18'], ans: 1, why: 'used to be fifteen（旧价格干扰），since April 改为 twelve pounds for adults。' },
        { q: 'What must the student show to collect the card?', opts: ['Proof of address only', 'Photo ID only', 'Both photo ID and proof of address', 'Nothing if registered online'], ans: 2, why: 'Two documents：照片证件 + 显示当前地址的单据，网上注册也须本人带证件来取。' },
        { q: 'How many books and other items can be borrowed at once?', opts: ['4', '8', '12', '15'], ans: 2, why: 'Up to twelve items（其中含最多 4 张 DVD）。' }
      ]
    },
    {
      type: 'dialogue', level: 1, scene: 'Section 1 · 餐厅订位',
      title: 'Booking a Restaurant Table 餐厅订位',
      turns: [
        { who: 'A', text: 'Good evening, The Garden Restaurant. How can I help?' },
        { who: 'B', text: 'Hi, I would like to book a table for this Friday evening, please. There will be six of us.' },
        { who: 'A', text: 'For six people on Friday… we are fully booked at eight o\'clock, but we have seven thirty or a quarter past nine.' },
        { who: 'B', text: 'Seven thirty would be better. Could we have a table by the window?' },
        { who: 'A', text: 'I can put you on the window table, yes. Could I take your name?' },
        { who: 'B', text: 'It is Mr Harding. H-A-R-D-I-N-G.' },
        { who: 'A', text: 'Thank you. Do any of your guests have dietary requirements?' },
        { who: 'B', text: 'Yes, two of us are vegetarian, and one person has a serious nut allergy. Also, we will need a high chair for a small child.' },
        { who: 'A', text: 'Noted. We require a deposit of ten pounds per person to confirm a large table, refunded if you cancel at least twenty-four hours in advance.' }
      ],
      questions: [
        { q: 'At what time is the table booked?', opts: ['7:30', '8:00', '8:15', '9:15'], ans: 0, why: '8 点已订满，顾客选择 seven thirty；9:15 是另一个备选干扰项。' },
        { q: 'How many guests are vegetarian?', opts: ['One', 'Two', 'Three', 'Six'], ans: 1, why: 'two of us are vegetarian；坚果过敏是另一位，别混为一谈。' },
        { q: 'What is required to confirm the booking?', opts: ['Paying the full bill in advance', 'A deposit of £10 per person', 'A deposit of £6 per person', 'An email confirmation only'], ans: 1, why: 'ten pounds per person 押金，提前 24 小时取消可退。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 1 · 兴趣班报名',
      title: 'Enrolling on a Pottery Course 陶艺课报名',
      turns: [
        { who: 'A', text: 'Riverside Community Centre, how can I help?' },
        { who: 'B', text: 'I saw your pottery courses advertised. I am a complete beginner. Is there a class I could join?' },
        { who: 'A', text: 'Yes. The Tuesday evening class is designed for beginners, from six thirty to eight thirty, running for eight weeks. The Thursday class still has places, but that one is for intermediate students.' },
        { who: 'B', text: 'What does the Tuesday course cost?' },
        { who: 'A', text: 'The full eight weeks is ninety-six pounds. That includes all clay and glazes, and the first firing of each piece. Additional firings cost four pounds each.' },
        { who: 'B', text: 'When does the course start?' },
        { who: 'A', text: 'On the third of November. You can enrol over the phone with a card payment, or online through the centre website.' },
        { who: 'B', text: 'Is there anything I need to bring?' },
        { who: 'A', text: 'Just an old towel for drying your hands. Aprons and all tools are provided, and we recommend not wearing your best clothes.' }
      ],
      questions: [
        { q: 'Who is the Tuesday evening class intended for?', opts: ['Intermediate students', 'Complete beginners', 'Professional potters', 'Children only'], ans: 1, why: 'Tuesday class is designed for beginners；Thursday 才是 intermediate（张冠李戴干扰）。' },
        { q: 'What is the fee for the full course?', opts: ['£48', '£80', '£96', '£104'], ans: 2, why: '完整 8 周共 ninety-six pounds（单周 £12 是心算陷阱，选项里有 £48/£80）。' },
        { q: 'What should students bring to the class?', opts: ['Their own clay', 'An apron', 'An old towel', 'Pottery tools'], ans: 2, why: '只要求 an old towel；黏土、围裙、工具均由中心提供。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 1 · 搬家预约',
      title: 'Booking a Removals Van 搬家公司预约',
      turns: [
        { who: 'A', text: 'Swift Move Removals, good morning.' },
        { who: 'B', text: 'Hi, I need to move out of my one-bedroom flat next week. Could you give me a quote?' },
        { who: 'A', text: 'Of course. For a one-bedroom flat, two movers with our medium van costs three hundred and eighty pounds for a half-day booking.' },
        { who: 'B', text: 'Does that include packing?' },
        { who: 'A', text: 'No, packing is an extra ninety pounds if you want us to bring boxes and pack for you. Most customers pack themselves.' },
        { who: 'B', text: 'I see. What day are you available?' },
        { who: 'A', text: 'We have Friday the fourteenth free. The crew would arrive at eight in the morning and usually finish by lunchtime.' },
        { who: 'B', text: 'That works. One thing: the new flat is on the third floor and there is no lift.' },
        { who: 'A', text: 'Ah, for stairs above the second floor we add a forty-pound surcharge. You will also need to arrange parking for the van yourself, as we cannot get permits from the council at short notice.' }
      ],
      questions: [
        { q: 'When will the movers arrive?', opts: ['Thursday the 13th, 8 am', 'Friday the 14th, 8 am', 'Friday the 14th, at noon', 'Saturday the 15th, 8 am'], ans: 1, why: 'Friday the fourteenth，crew arrive at eight in the morning，通常午饭前完成。' },
        { q: 'What is the £40 surcharge for?', opts: ['Packing service', 'Carrying furniture up three floors without a lift', 'Parking permits', 'A larger van'], ans: 1, why: 'stairs above the second floor add a forty-pound surcharge（三楼无电梯）。' },
        { q: 'What must the customer arrange himself?', opts: ['The packing boxes', 'The insurance', 'Parking for the van', 'Lift access'], ans: 2, why: 'you will also need to arrange parking…yourself，公司来不及向市政申请许可。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 1 · 车站失物',
      title: 'Lost Property at the Station 车站失物招领',
      turns: [
        { who: 'A', text: 'Lost property office, how can I help?' },
        { who: 'B', text: 'I think I left a bag on a train yesterday morning. I wonder if it has been handed in.' },
        { who: 'A', text: 'I can check for you. Which train were you on?' },
        { who: 'B', text: 'The seven forty-two service into Central Station, on Tuesday the nineteenth.' },
        { who: 'A', text: 'Can you describe the bag?' },
        { who: 'B', text: 'It is a navy-blue canvas shoulder bag with a silver zip. Inside there is a laptop, and a notebook with my name, Daniel Cross, written inside the cover.' },
        { who: 'A', text: 'Just a moment… yes, a bag matching that description arrived here yesterday afternoon. There is a three-pound administration fee to collect it.' },
        { who: 'B', text: 'Wonderful. How long do you keep items for?' },
        { who: 'A', text: 'We hold lost property for three months. After that, uncollected items are donated to charity. The office is open until six on weekdays.' }
      ],
      questions: [
        { q: 'Which train did the passenger leave the bag on?', opts: ['The 7:20 on Monday', 'The 7:42 on Tuesday', 'The 8:42 on Tuesday', 'The 7:42 on Thursday'], ans: 1, why: 'seven forty-two service…on Tuesday the nineteenth，时间和日期双重数字考点。' },
        { q: 'What does the bag look like?', opts: ['Black leather with a gold zip', 'Navy-blue canvas with a silver zip', 'Grey backpack with no zip', 'Brown canvas with a name tag'], ans: 1, why: 'navy-blue canvas shoulder bag with a silver zip；名字写在笔记本封皮内侧而非行李牌上。' },
        { q: 'How long does the office keep uncollected items?', opts: ['Two weeks', 'One month', 'Three months', 'One year'], ans: 2, why: 'We hold lost property for three months，之后捐赠慈善机构。' }
      ]
    },
    {
      type: 'dialogue', level: 2, scene: 'Section 2 · 慈善跑活动',
      title: 'Charity Fun Run Interview 慈善跑活动访谈',
      turns: [
        { who: 'A', text: 'With me today is Sarah, organiser of this year\'s Riverside Charity Fun Run. Sarah, tell us what is happening.' },
        { who: 'B', text: 'Yes, the run takes place on Sunday the twelfth of May, starting in Riverside Park. Both the five-kilometre and ten-kilometre routes begin at ten thirty.' },
        { who: 'A', text: 'How much does it cost to enter?' },
        { who: 'B', text: 'If you register online before the fifth of May, it is sixteen pounds for adults and eight pounds for under-sixteens. Entry on the day itself costs twenty pounds, so it really is worth booking early.' },
        { who: 'A', text: 'What does the entry fee include?' },
        { who: 'B', text: 'Every runner receives a free event T-shirt, and there is a water station at the halfway point. You can leave bags at the pavilion near the start line.' },
        { who: 'A', text: 'Where does the money go?' },
        { who: 'B', text: 'All of it, every penny, goes to the City Children\'s Hospital. One important note: for safety reasons, dogs and bicycles are not allowed on either route.' },
        { who: 'A', text: 'Sounds like a great day. Thanks for joining us.' }
      ],
      questions: [
        { q: 'When do the runs start?', opts: ['9:30 am', '10:00 am', '10:30 am', '11:00 am'], ans: 2, why: '5km 和 10km 都在 ten thirty 出发。' },
        { q: 'How much does an adult pay when registering online in advance?', opts: ['£8', '£16', '£18', '£20'], ans: 1, why: '提前网上报名 adults £16；£8 是 16 岁以下，£20 是当天现场价，两个干扰项。' },
        { q: 'What are runners forbidden from bringing?', opts: ['Water bottles', 'Dogs', 'T-shirts', 'Young children'], ans: 1, why: 'for safety reasons, dogs and bicycles are not allowed（狗和自行车禁带）。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 生态环境',
      title: 'The Decline of Honeybees 蜜蜂减少',
      paragraphs: [
        'Most of us associate bees with honey, but their real importance lies in pollination. Around one third of the food we eat depends, directly or indirectly, on animal pollination, and the honeybee is the single most important pollinator in agriculture. Without bees, crops such as almonds, apples and coffee would become far harder and more expensive to grow.',
        'Since the early 2000s, beekeepers in many countries have reported unusually heavy losses, a phenomenon sometimes called colony collapse disorder. There is no single cause. The parasitic varroa mite weakens bees and spreads viruses, while certain pesticides damage their navigation and memory. On top of this, the spread of monoculture farming means bees now find large areas with almost no flowering plants to feed on.',
        'The good news is that ordinary people can help. Studies suggest that gardens planted with native wildflowers support more bees than neatly mown lawns, and even window boxes can make a difference in cities. Farmers, meanwhile, can plant wild strips at field edges and reduce spraying during the flowering season. Protecting bees, in other words, turns out to be a problem with many small solutions rather than one grand fix.'
      ],
      questions: [
        { q: 'Roughly what share of the human food supply depends on animal pollination?', opts: ['About one tenth', 'About one third', 'About two thirds', 'Almost all of it'], ans: 1, why: 'Around one third of the food we eat depends…on animal pollination。' },
        { q: 'Which problem is caused by monoculture farming?', opts: ['It spreads the varroa mite', 'It directly poisons bees with pesticides', 'It leaves large areas without flowering plants', 'It raises the price of honey'], ans: 2, why: 'monoculture 的后果是大片区域几乎没有开花植物可觅食；螨虫和农药是另外两个并列原因，勿错配。' },
        { q: 'What does the speaker recommend that ordinary gardeners do?', opts: ['Keep honeybee hives', 'Mow lawns more often', 'Plant native wildflowers', 'Stop using fertiliser'], ans: 2, why: 'native wildflowers 比修剪整齐的草坪更养蜂，城市窗台花箱也有用。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 农业科技',
      title: 'Vertical Farming 垂直农业',
      paragraphs: [
        'Vertical farming means growing crops in stacked layers inside buildings, often without any soil at all. Plants sit in trays where nutrient-rich water flows past their roots, a technique called hydroponics, and light comes from powerful lamps tuned to the wavelengths plants use most efficiently. A single warehouse can therefore hold the equivalent growing area of dozens of hectares of farmland.',
        'The advantages are striking. Because the water circulates in a closed system, vertical farms use up to ninety-five percent less water than field agriculture. There is no soil erosion, no need for pesticides, and crops can be harvested all year round regardless of weather. Locating farms on the edge of cities also cuts the distance food travels before reaching the consumer.',
        'There are, however, real limits. Powering the lamps is expensive, so only high-value crops such as salad leaves and herbs are profitable today; nobody is growing wheat in a vertical farm. Critics also point out that a farm is only as clean as its electricity supply. As renewable energy becomes cheaper, though, the economics are steadily improving, and the industry is now growing at roughly thirty percent a year.'
      ],
      questions: [
        { q: 'How much water can vertical farms save compared with field agriculture?', opts: ['About 25 percent', 'About 50 percent', 'Up to 75 percent', 'Up to 95 percent'], ans: 3, why: 'up to ninety-five percent less water，因为水在封闭系统内循环。' },
        { q: 'Why are mainly salad leaves and herbs grown today?', opts: ['They need no light', 'They are high-value crops that cover the energy costs', 'They grow without nutrients', 'They are immune to pests'], ans: 1, why: '照明电费高昂，只有高价值作物盈利；小麦等大宗作物不划算。' },
        { q: 'According to the speaker, when will the economics improve?', opts: ['As renewable energy becomes cheaper', 'When urban land prices fall', 'After pesticides are banned', 'When wheat yields rise'], ans: 0, why: 'As renewable energy becomes cheaper…the economics are steadily improving。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 能源',
      title: 'Tidal Power 潮汐能',
      paragraphs: [
        'Of all renewable energy sources, tidal power is the oldest idea and, in some ways, the most attractive. Unlike wind and sunshine, the tides are completely predictable: engineers know centuries in advance exactly how much energy will arrive and when. Yet despite this advantage, tidal power still supplies only a tiny fraction of the world\'s electricity.',
        'There are two main technologies. A tidal barrage works like a dam across an estuary, trapping water at high tide and releasing it through turbines as the sea falls. The world\'s first large barrage opened in France in 1966, and the largest today is the Sihwa station in South Korea. The newer approach places underwater turbines directly on the seabed, where currents spin them like underwater windmills.',
        'The technology has been held back by cost and environmental concerns. Barrages alter water levels across whole estuaries, changing mudflats where migrating birds feed and possibly disturbing fish, although modern slow-turning turbines are designed to be far safer for marine life. Several small turbine arrays are now being tested around Scotland, and many engineers believe the predictability of the tides makes them worth the investment.'
      ],
      questions: [
        { q: 'What is the main advantage of tidal power over wind and solar?', opts: ['It is cheaper to build', 'Its energy supply is entirely predictable', 'It works well in every country', 'It causes no environmental change'], ans: 1, why: 'the tides are completely predictable，可提前数百年精确预测；便宜和无环境影响都被后文否定。' },
        { q: 'Where is the world\'s largest tidal barrage today?', opts: ['France', 'Scotland', 'South Korea', 'Japan'], ans: 2, why: 'largest today is the Sihwa station in South Korea；法国 1966 年的是「最早」而非「最大」。' },
        { q: 'What environmental concern is associated with barrages?', opts: ['They pollute the air', 'They change estuary mudflats and may disturb fish', 'They kill birds flying through blades', 'They raise sea temperature'], ans: 1, why: 'barrages 改变河口水位和候鸟觅食的泥滩、可能干扰鱼类；现代慢速涡轮是为减轻此问题。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 心理学',
      title: 'The Psychology of Procrastination 拖延心理学',
      paragraphs: [
        'Psychologists used to regard procrastination as a failure of time management, but modern research tells a different story. Procrastination is better understood as a problem of emotion regulation. When a task makes us feel anxious, incompetent or bored, the brain seeks immediate relief by turning to something more pleasant. The task itself is not avoided because it is difficult; the unpleasant feeling attached to it is avoided.',
        'Brain studies help explain why this is so hard to resist. The amygdala, an ancient brain region associated with threat detection, responds when we contemplate a frightening task, and its signals can override the planning areas of the prefrontal cortex. We also show what economists call present bias: a cost felt now, however small, looms larger than a much larger cost weeks in the future.',
        'Fortunately, several strategies have evidence behind them. The so-called five-minute rule works because agreeing to work for just five minutes lowers the emotional barrier, and once started, most people continue. A second finding is more surprising: students who forgave themselves for procrastinating before an exam actually procrastinated less on the next one. Self-compassion, it seems, breaks the cycle of guilt and avoidance far better than self-criticism.'
      ],
      questions: [
        { q: 'How do modern psychologists define procrastination?', opts: ['As a failure of time management', 'As an emotion-regulation problem', 'As a form of laziness', 'As a memory disorder'], ans: 1, why: '旧观点是时间管理失败，现代研究认为是 emotion regulation（情绪调节）问题。' },
        { q: 'What did the study on self-forgiveness find?', opts: ['It made students procrastinate more', 'It reduced procrastination on later tasks', 'It had no measurable effect', 'It worked only for high achievers'], ans: 1, why: '原谅自己的学生下次考试反而拖延更少；自我宽容打破「内疚→逃避」循环。' },
        { q: 'Why does the five-minute rule work?', opts: ['It finishes most tasks in five minutes', 'It lowers the emotional barrier to starting', 'It removes the need for planning', 'It activates the amygdala'], ans: 1, why: '答应只做五分钟可降低情绪门槛，而一旦开始多数人会继续。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 历史',
      title: 'A Short History of Chocolate 巧克力小史',
      paragraphs: [
        'The story of chocolate begins in Mesoamerica over three and a half thousand years ago. The Maya and Aztec peoples ground roasted cacao beans into a bitter, spicy drink, often flavoured with chilli and vanilla, which was consumed during ceremonies. Cacao beans were so valued that they were also used as currency; a rabbit, according to one Spanish account, cost about ten beans.',
        'Chocolate reached Europe in the sixteenth century, when Spanish explorers brought beans back from Mexico. The Spanish kept the drink fashionable by sweetening it with sugar and cinnamon, and for nearly a hundred years it remained a luxury known mainly in Spain before spreading to the rest of Europe, where it was served in fashionable chocolate houses.',
        'Chocolate as we know it today — a solid, sweet bar — is surprisingly recent. In 1828, a Dutch chemist named Coenraad van Houten invented a press that removed much of the fat from roasted beans, producing cocoa powder and making large-scale manufacture possible. The first edible chocolate bars appeared in Britain in 1847, and within decades chocolate changed from an elite drink into the world\'s most popular confection.'
      ],
      questions: [
        { q: 'How was chocolate originally consumed in Mesoamerica?', opts: ['As a solid sweet bar', 'As a bitter spiced drink', 'As a cooking oil', 'As a frozen dessert'], ans: 1, why: '最初是加辣椒和香草的苦涩饮品，用于仪式；固体巧克力是 19 世纪才有的。' },
        { q: 'Besides making a drink, what else were cacao beans used for?', opts: ['Building material', 'Jewellery', 'Money', 'Medicine for rabbits'], ans: 2, why: '豆子价值极高，used as currency（一只兔子约值 10 颗豆）。' },
        { q: 'What did van Houten\'s invention make possible?', opts: ['Spicing chocolate with chilli', 'Producing solid eating chocolate at scale', 'Shipping beans from Mexico', 'Sweetening chocolate with sugar'], ans: 1, why: '1828 年压榨机去除大部分脂肪得到可可粉，使大规模制造与后来的固体巧克力成为可能。' }
      ]
    },
    {
      type: 'lecture', level: 3, scene: 'Section 4 · 工程仿生',
      title: 'Biomimicry: Learning from Nature 仿生学',
      paragraphs: [
        'Biomimicry is the practice of solving human engineering problems by copying principles found in nature. The idea is simple: over billions of years of evolution, organisms have already solved problems such as adhesion, temperature control and energy efficiency, and they have done so using ordinary materials, quietly and without pollution. The key word, though, is principles: biomimicry copies how something works, not merely what it looks like.',
        'Some examples have become famous. When Japanese engineers redesigned the high-speed Shinkansen train, its exit from tunnels produced a thunderous sonic boom. The solution came from the kingfisher, whose beak lets the bird dive into water almost without a splash; a beak-shaped train nose cut the noise and even saved energy. Elsewhere, the tiny hairs on gecko feet inspired a reusable adhesive tape, while the self-cleaning surface of lotus leaves produced dirt-resistant paint.',
        'My favourite example is the Eastgate Centre in Harare, a large building modelled on termite mounds. By opening and closing vents as the mounds do, the structure cools itself with outside air and uses a fraction of the energy of a conventional air-conditioned building. The discipline requires biologists and engineers to work together from the start — but as these cases show, the natural world is a research library we have only just begun to open.'
      ],
      questions: [
        { q: 'What problem did the kingfisher-inspired train nose solve?', opts: ['It increased passenger capacity', 'It removed the sonic boom in tunnels', 'It made the train lighter', 'It reduced ticket prices'], ans: 1, why: '翠鸟喙入水几乎不溅水 → 喙形车头消除出洞的音爆并节能。' },
        { q: 'What does the termite-mound-inspired building achieve?', opts: ['It needs no concrete', 'It cools itself using outside air', 'It houses termites for research', 'It resists earthquakes'], ans: 1, why: 'Eastgate Centre 仿白蚁丘开关通风口，用室外空气自降温，能耗远低于空调建筑。' },
        { q: 'According to the speaker, what is the key principle of biomimicry?', opts: ['Copying the appearance of animals exactly', 'Copying functional principles rather than shapes', 'Using natural materials directly', 'Replacing engineers with biologists'], ans: 1, why: 'copies how something works, not merely what it looks like（复制工作原理而非外形）。' }
      ]
    }
  
  ];

  return {
    WORD_CATS: WORD_CATS,
    WORDS: WORDS,
    LISTENING: LISTENING,
    DAILY_PHRASES: DAILY_PHRASES,
    LISTEN_PARTS: LISTEN_PARTS,
    READING: READING,
    WRITING: WRITING,
    SPEAKING: SPEAKING,
    TIPS: TIPS,
    PARAPHRASE: PARAPHRASE
  };
});
