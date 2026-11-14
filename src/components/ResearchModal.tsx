import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ResearchFigure {
  id: string;
  filename: string;
  source: string;
  doiOrReport: string;
  pdfPage: number;
  figure: string;
  titleEn: string;
  titleVi: string;
  category: 'horizon' | 'solar_disc' | 'height' | 'validation' | 'multicriteria';
  descriptionVi: string;
  equationRefs: string[];
}

const RESEARCH_FIGURES: ResearchFigure[] = [
  {
    id: 'fig-01',
    filename: '01-horizon-database.png',
    source: 'Mazarico et al. (2011)',
    doiOrReport: '10.1016/j.icarus.2010.10.030',
    pdfPage: 4,
    figure: 'Figure 2',
    titleEn: 'Azimuthal Horizon Obstruction Database from LOLA Topography',
    titleVi: 'Tính và lưu cơ sở dữ liệu đường chân trời theo các hướng từ LOLA',
    category: 'horizon',
    descriptionVi: 'Xây dựng cơ sở dữ liệu đường chân trời H(A) bằng cách quét các tia theo 720 hướng phương vị (bước 0.5°). Tìm góc cao vật cản lớn nhất e_j = max atan2(U_j, sqrt(E_j^2 + N_j^2)). Giúp tính toán chiếu sáng tức thời mà không phải dò lại địa hình ở từng bước thời gian.',
    equationRefs: ['Eq. 05: H(A_i) = max e_j', 'Eq. 06: Circular interpolation across 0°/360°'],
  },
  {
    id: 'fig-02',
    filename: '02-lunar-curvature.png',
    source: 'Gläser et al. (2014)',
    doiOrReport: '10.1016/j.icarus.2014.08.013',
    pdfPage: 5,
    figure: 'Figure 7',
    titleEn: 'Topography Geometry, Tangent Planes, and Lunar Curvature',
    titleVi: 'Hình học địa hình, mặt phẳng tiếp tuyến và độ cong Mặt Trăng',
    category: 'horizon',
    descriptionVi: 'Mô hình hóa hình học quan sát 3D đầy đủ trên bề mặt cầu Mặt Trăng (R_M = 1,737,400 m). Tọa độ 3D body-fixed gắn liền với hệ Đông-Bắc-Lên (ENU) tại điểm quan sát đã tích hợp chính xác độ cong Mặt Trăng mà không cần hiệu chỉnh nhân tạo lần thứ hai.',
    equationRefs: ['Eq. 01: r_o^B = (R_M + z_0 + h) [...]', 'Eq. 03: ENU transformation matrix', 'Eq. 04: atan2 azimuth & elevation'],
  },
  {
    id: 'fig-03',
    filename: '03-visible-solar-disc.png',
    source: 'Gläser et al. (2014)',
    doiOrReport: '10.1016/j.icarus.2014.08.013',
    pdfPage: 5,
    figure: 'Figure 8',
    titleEn: 'Analytical Visible Solar Disc Area Fraction f_sun(x)',
    titleVi: 'Tỷ lệ diện tích đĩa Mặt Trời không bị địa hình che khuất',
    category: 'solar_disc',
    descriptionVi: 'Mặt Trời không phải một điểm mà là một đĩa sáng có bán kính góc alpha_sun ≈ 0.266°. Khi đường chân trời cắt ngang đĩa Mặt Trời ở khoảng cách góc D = e_sun - H(A), tỷ lệ diện tích nhìn thấy f_sun(x) được tính giải tích qua phương trình hình quạt tròn (Equation 09).',
    equationRefs: ['Eq. 09: f_sun(x) = 0.5 + (arcsin x + x*sqrt(1-x^2))/pi', 'Eq. 12: Trapezoidal rule integration'],
  },
  {
    id: 'fig-04',
    filename: '04-sun-earth-horizon.png',
    source: 'Bryant (2009)',
    doiOrReport: 'JPL IPN Progress Report 42-176, 176C',
    pdfPage: 10,
    figure: 'Figure 5',
    titleEn: 'Terrain Horizon Mask with Sun and Earth Motion Envelopes',
    titleVi: 'Đường chân trời và miền chuyển động Mặt Trời / Trái Đất',
    category: 'horizon',
    descriptionVi: 'Mô hình tiên phong của JPL phân tích đồng thời điều kiện chiếu sáng (năng lượng) và khả năng nhìn thấy Trái Đất (liên lạc vô tuyến) tại cực Nam Mặt Trăng. Vùng chuyển động của Trái Đất phản ánh hiện tượng đung đưa quang học và vật lý (lunar libration ±7°).',
    equationRefs: ['Eq. 07: Point-object clearance g_X(t) > 0', 'Eq. 08: Earth engineering clearance beta >= 0.5°'],
  },
  {
    id: 'fig-05',
    filename: '05-illumination-time-series.png',
    source: 'Gläser et al. (2014)',
    doiOrReport: '10.1016/j.icarus.2014.08.013',
    pdfPage: 9,
    figure: 'Figure 18',
    titleEn: 'Long-term Illumination Time Series and Micro-Blackout Events',
    titleVi: 'Chuỗi tỷ lệ đĩa Mặt Trời nhìn thấy theo thời gian và các vi bóng tối',
    category: 'solar_disc',
    descriptionVi: 'Chuỗi thời gian tỷ lệ chiếu sáng cho thấy ngay cả tại các đỉnh cực Nam có độ chiếu sáng cao (80-90%), địa hình gồ ghề vẫn tạo ra các khoảng bóng tối ngắn hạn (micro-blackouts). Việc tính toán chính xác thời gian tối liên tục dài nhất (LCSP) là tối quan trọng cho thiết kế ắc quy của trạm đổ bộ.',
    equationRefs: ['Eq. 10: Percentage P_X & Data coverage C_X', 'Eq. 11: Longest continuous dark period L_dark'],
  },
  {
    id: 'fig-06',
    filename: '06-height-comparison.png',
    source: 'Barker et al. (2021)',
    doiOrReport: '10.1016/j.pss.2020.105119',
    pdfPage: 9,
    figure: 'Figure 14',
    titleEn: 'Observer Mast Height Comparison: 1m vs 5m (Illumination, LCIP, LCSP)',
    titleVi: 'So sánh chiếu sáng, LCIP và LCSP ở độ cao 1 m và 5 m',
    category: 'height',
    descriptionVi: 'Khảo sát đột phá của Barker et al. cho thấy việc nâng cột thu năng lượng từ 1 m (mặt sàn xe tự hành) lên 2 m hoặc 5 m (cột đổ bộ) giúp hạ thấp góc cao vật cản địa hình xung quanh, tăng mạnh tỷ lệ chiếu sáng và đặc biệt rút ngắn chu kỳ tối liên tục dài nhất (LCSP) hàng chục đến hàng trăm giờ.',
    equationRefs: ['Barker 2021 Multi-height LOLA sensitivity', 'LCSP / LCIP Trade Study'],
  },
  {
    id: 'fig-07',
    filename: '07-shadow-validation.png',
    source: 'Zhang et al. (2023)',
    doiOrReport: '10.3390/rs15245691',
    pdfPage: 10,
    figure: 'Figure 7',
    titleEn: 'Shadow Mismatch Validation with Orbital LROC-NAC Imagery',
    titleVi: 'Ảnh nhị phân và bản đồ sai khác vùng sáng/tối với ảnh LROC-NAC',
    category: 'validation',
    descriptionVi: 'Phương pháp kiểm chứng mô hình chiếu sáng số bằng cách đối chiếu nhị phân ảnh mô phỏng DEM với ảnh thực tế LROC Narrow Angle Camera (NAC). Đo lường tỷ lệ sai lệch tổng thể (TMR), sai lệch vùng sáng (LZMR) và sai lệch vùng tối (DZMR) thông qua toán tử XOR.',
    equationRefs: ['Eq. 18: TMR = sum(Miss) / N_valid', 'Eq. 19: Light/Dark mismatch ratios LZMR & DZMR'],
  },
  {
    id: 'fig-08',
    filename: '08-horizon-solar-path.png',
    source: 'Gläser et al. (2014)',
    doiOrReport: '10.1016/j.icarus.2014.08.013',
    pdfPage: 9,
    figure: 'Figure 19',
    titleEn: 'Horizon Profile Colored by Blocker Distance and Solar Trajectory',
    titleVi: 'Đường chân trời theo khoảng cách vật cản và quỹ đạo tâm Mặt Trời',
    category: 'horizon',
    descriptionVi: 'Phân tích khoảng cách đến đỉnh cản địa hình: các đỉnh cản xa (trên 50-100 km) tạo ra chân trời răng cưa ổn định, trong khi các gờ miệng hố gần (dưới 5 km) tạo ra các vật cản cục bộ biến động mạnh theo độ cao người quan sát.',
    equationRefs: ['Eq. 05: Distance-dependent blocker elevation', 'Eq. 14: Solar direction vector in ENU'],
  },
  {
    id: 'fig-09',
    filename: '09-disc-interpolation.png',
    source: 'De Rosa et al. (2012)',
    doiOrReport: '10.1016/j.pss.2012.08.002',
    pdfPage: 28,
    figure: 'Figure 6',
    titleEn: 'Horizon Circular Interpolation and Visible Solar Fraction in Astrium ICAT Tool',
    titleVi: 'Nội suy đường chân trời và xấp xỉ phần đĩa Mặt Trời trong công cụ ICAT',
    category: 'solar_disc',
    descriptionVi: 'Kiểm chứng phương pháp tính góc chân trời tại phương vị bất kỳ bằng cách nội suy tuyến tính giữa các điểm rời rạc kề nhau, xử lý trơn chu qua ranh giới 359° -> 0° -> 1°. Đối chiếu diện tích đĩa thực tế với xấp xỉ phân đoạn thẳng (sai số dưới 0.4%).',
    equationRefs: ['Eq. 06: Circular linear interpolation w = (A - A_i)/(A_{i+1} - A_i)', 'Eq. 13: Transition crossing root finding'],
  },
  {
    id: 'fig-10',
    filename: '10-multicriteria-extension.png',
    source: 'Liu et al. (2025)',
    doiOrReport: '10.3390/rs17091579',
    pdfPage: 5,
    figure: 'Figure 2',
    titleEn: 'Multi-criteria South Polar Landing Zone Selection using Self-Organizing Maps (SOM)',
    titleVi: 'Quy trình mở rộng đánh giá đa tiêu chí bằng mạng SOM và Random Forest',
    category: 'multicriteria',
    descriptionVi: 'Khung mở rộng tích hợp đa nguồn: kết hợp khả năng nhìn thấy Mặt Trời, Trái Đất, bản đồ độ dốc địa hình (slope), độ gồ ghề (roughness) và nhiệt độ bề mặt (Diviner) để phân cụm và lựa chọn bãi hạ cánh tối ưu cho các sứ mệnh có người và robot.',
    equationRefs: ['Eq. 16: PV Power & Energy modeling', 'Eq. 17: Local slope gamma = arctan(sqrt(p^2 + q^2))'],
  },
];

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFig, setSelectedFig] = useState<ResearchFigure>(RESEARCH_FIGURES[2]); // Default to solar disc fig-03

  if (!isOpen) return null;

  const filteredFigures =
    selectedCategory === 'all'
      ? RESEARCH_FIGURES
      : RESEARCH_FIGURES.filter((f) => f.category === selectedCategory);

  const categories = [
    { id: 'all', label: t.researchCatAll },
    { id: 'solar_disc', label: t.researchCatSolar },
    { id: 'horizon', label: t.researchCatHorizon },
    { id: 'height', label: t.researchCatHeight },
    { id: 'validation', label: t.researchCatValidation },
    { id: 'multicriteria', label: t.researchCatMulti },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#070d1e]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-700/50 rounded">
                SCIENTIFIC FOUNDATIONS
              </span>
              <h2 className="text-xl font-bold text-cyan-300">
                {t.researchModalTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.researchModalSub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-slate-800 bg-[#091124] text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left Figure Preview & Metadata (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-[#050914] border border-cyan-900/40 rounded-lg p-3 flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span className="font-mono text-cyan-400">{selectedFig.source} - {selectedFig.figure}</span>
                <span className="text-slate-500">PDF Page {selectedFig.pdfPage}</span>
              </div>
              <div className="relative w-full max-h-[380px] flex items-center justify-center bg-slate-950/80 rounded border border-slate-800/80 p-2 overflow-hidden">
                <img
                  src={`assets/figures/${selectedFig.filename}`}
                  alt={selectedFig.titleEn}
                  className="max-h-[350px] w-auto object-contain rounded"
                  onError={(e) => {
                    // Fallback to documents path if relative asset not found
                    (e.target as HTMLImageElement).src = `documents/assets/figures/${selectedFig.filename}`;
                  }}
                />
              </div>
              <div className="w-full mt-2 text-center text-xs text-slate-400 italic">
                {language === 'vi' ? selectedFig.titleVi : selectedFig.titleEn}
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-[#081024] border border-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center gap-2">
                <span>📘</span> {language === 'vi' ? selectedFig.titleVi : selectedFig.titleEn}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {selectedFig.descriptionVi}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                {selectedFig.equationRefs.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[11px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 rounded"
                  >
                    {eq}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-mono">
                Source Reference: {selectedFig.source} | DOI: {selectedFig.doiOrReport}
              </div>
            </div>
          </div>

          {/* Right Figure List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto max-h-[580px] pr-1">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {t.researchSelectTitle} ({filteredFigures.length}):
            </h3>
            {filteredFigures.map((fig) => {
              const isSelected = selectedFig.id === fig.id;
              return (
                <div
                  key={fig.id}
                  onClick={() => setSelectedFig(fig)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-[#081024]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#0b1632]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-300">
                      {fig.source} ({fig.figure})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {fig.category}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">
                    {language === 'vi' ? fig.titleVi : fig.titleEn}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {fig.descriptionVi}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#070d1e] text-xs text-slate-400">
          <div>
            Implemented in accordance with <span className="text-cyan-400 font-mono">LUNAR_LANDING_IMPLEMENTATION.md</span> Parts A, B & C.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

