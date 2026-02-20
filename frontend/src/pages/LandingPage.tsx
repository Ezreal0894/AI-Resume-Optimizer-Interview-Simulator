/**
 * 落地页
 * 设计系统：极简现代主义，呼吸感留白，清晰视觉层次
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  Mic,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 浮动导航栏 */}
      <motion.header
        className={`fixed top-4 left-4 right-4 z-50 transition-all duration-150 rounded-xl ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border border-gray-200 shadow-soft'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-soft">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-gray-900">AI 职通车</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['产品功能', '使用案例', '定价', '关于我们'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-gray-500 hover:text-primary-500 transition-colors duration-150"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150"
            >
              登录
            </Link>
            <Link to="/register">
              <motion.button
                className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg shadow-soft"
                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                免费开始
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-500 text-xs font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              AI 驱动的求职加速器
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              用 AI 重塑你的
              <span className="text-primary-500">求职之路</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto"
            >
              智能简历优化 + AI 模拟面试 + 深度能力分析，让每一次求职都更有把握
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-4"
            >
              <Link to="/register">
                <motion.button
                  className="px-8 py-4 bg-primary-500 text-white rounded-lg font-medium text-base flex items-center gap-2 shadow-soft"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 12px 40px rgba(14,165,233,0.35)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  立即体验 <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                </motion.button>
              </Link>
              <motion.button
                className="px-8 py-4 bg-white text-gray-600 rounded-lg font-medium text-base flex items-center gap-2 border border-gray-200 shadow-soft"
                whileHover={{ scale: 1.02, backgroundColor: '#F9FAFB' }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" strokeWidth={1.5} /> 观看演示
              </motion.button>
            </motion.div>
          </motion.div>

          {/* 浏览器预览图 */}
          <motion.div
            className="mt-20 relative"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gray-900 rounded-2xl p-2 shadow-hover">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-gray-800 rounded-lg text-gray-400 text-xs">
                    ai-career.app
                  </div>
                </div>
              </div>
              <div className="aspect-video bg-gray-800 rounded-b-xl flex items-center justify-center">
                <div className="text-gray-500 flex items-center gap-2">
                  <Briefcase className="w-8 h-8" strokeWidth={1.5} />
                  <span className="text-base">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Sections */}
      <FeatureSection
        title="智能简历优化"
        subtitle="AI 深度解析，让你的简历脱颖而出"
        description="上传简历，AI 将从 ATS 兼容性、关键词匹配、内容结构等多维度进行分析，提供专业的优化建议。"
        icon={<FileText className="w-8 h-8" strokeWidth={1.5} />}
        features={[
          'ATS 系统兼容性检测',
          '行业关键词智能匹配',
          '内容结构优化建议',
          '一键生成优化版本',
        ]}
        reversed={false}
      />
      <FeatureSection
        title="AI 模拟面试"
        subtitle="真实场景演练，告别面试焦虑"
        description="基于目标岗位定制面试问题，AI 面试官实时互动，帮你在真正面试前做好充分准备。"
        icon={<Mic className="w-8 h-8" strokeWidth={1.5} />}
        features={[
          '岗位定制化问题库',
          '实时语音交互',
          '表情与肢体语言分析',
          '即时反馈与建议',
        ]}
        reversed={true}
        bgColor="bg-gray-50"
      />
      <FeatureSection
        title="深度能力报告"
        subtitle="数据驱动，精准定位提升方向"
        description="每次面试后生成详细的能力分析报告，多维度雷达图直观展示，AI 点评助你持续进步。"
        icon={<BarChart3 className="w-8 h-8" strokeWidth={1.5} />}
        features={[
          '五维能力雷达图',
          '历史趋势对比',
          'AI 深度点评',
          '个性化提升计划',
        ]}
        reversed={false}
      />

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-50">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            准备好开启你的求职加速之旅了吗？
          </h2>
          <p className="text-lg text-gray-500 mb-10">
            加入 10,000+ 求职者，让 AI 成为你的职场导师
          </p>
          <Link to="/register">
            <motion.button
              className="px-10 py-5 bg-primary-500 text-white rounded-lg font-medium text-base shadow-soft"
              whileHover={{
                scale: 1.02,
                boxShadow: '0 12px 40px rgba(14,165,233,0.35)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              免费开始使用
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-white">AI 职通车</span>
          </div>
          <p className="text-sm text-gray-500">© 2024 AI 职通车. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureSection({
  title,
  subtitle,
  description,
  icon,
  features,
  reversed,
  bgColor = 'bg-white',
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  reversed: boolean;
  bgColor?: string;
}) {
  return (
    <section className={`py-24 px-6 ${bgColor}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className={`flex flex-col ${
            reversed ? 'md:flex-row-reverse' : 'md:flex-row'
          } items-center gap-16`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <motion.div className="flex-1" variants={fadeInUp}>
            <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500 mb-6">
              {icon}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-base text-primary-500 font-medium mb-4">{subtitle}</p>
            <p className="text-gray-500 mb-8">{description}</p>
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3 text-sm text-gray-600"
                  variants={fadeInUp}
                >
                  <CheckCircle className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div className="flex-1" variants={fadeInUp}>
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center shadow-soft">
              <div className="text-gray-300">{icon}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
