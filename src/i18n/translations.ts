export type Language = 'vi' | 'en';

export interface Translations {
  // App Header
  appName: string;
  appSubtitle: string;
  nasaBadge: string;
  syncing: string;
  researchButton: string;
  howItWorksButton: string;
  exportJsonButton: string;
  modeRealTerrain: string;
  modeRealGeometric: string;
  modeDemo: string;
  selectMode: string;

  // Site Config Panel
  candidateSitesTitle: string;
  sitesConfigured: string;
  siteName: string;
  latitudeLabel: string;
  latitudeHint: string;
  longitudeLabel: string;
  longitudeHint: string;
  observerHeightLabel: string;
  terrainElevationLabel: string;
  terrainElevationHint: string;
  horizonProfileLabel: string;
  noProfileAssigned: string;
  importCsvBtn: string;
  removeProfileBtn: string;
  openExternalTools: string;
  illustrativeNotice: string;
  coordinatesConvention: string;

  // Mission Settings Panel
  missionSettingsTitle: string;
  samplesPerSite: string;
  startTimeLabel: string;
  durationLabel: string;
  maxDaysHint: string;
  samplingIntervalLabel: string;
  min15: string;
  min30: string;
  hour1: string;
  hour2: string;
  solarModelLabel: string;
  finiteDiscOption: string;
  pointModelOption: string;
  sunlitCriterionLabel: string;
  anyVisibleOption: string;
  partial10Option: string;
  halfDiscOption: string;
  fullDiscOption: string;
  pvConfigToggle: string;
  pvOrientationLabel: string;
  pvTrackingVertical: string;
  pvFixedVertical: string;
  pvHorizontalFlat: string;
  arrayAreaLabel: string;
  cellEfficiencyLabel: string;
  earthClearanceLabel: string;
  earthClearanceDesc: string;
  analyzeBtn: string;
  queryingHorizons: string;
  analysisErrorTitle: string;
  dismissBtn: string;
  useFallbackBtn: string;
  horizonsFooter: string;

  // Lunar Site Map
  polarMapTitle: string;
  polarMapSub: string;
  layerRelief: string;
  layerElevation: string;
  layerWac: string;
  layerEarthLos: string;
  rulerTool: string;
  rulerDistance: string;
  clickMapNotice: string;
  openQuickMap: string;
  openMoonTrek: string;
  toolRelocate: string;
  relocateHint: string;
  measureHint: string;
  distanceLabel: string;
  layerCraters: string;
  layerPolarGrid: string;
  layerSunVector: string;
  layerEarthVector: string;
  layerPsr: string;
  cursorLabel: string;

  // Local Horizon Chart
  skyChartTitle: string;
  skyChartSub: string;
  polarZoomBtn: string;
  fullViewBtn: string;
  refHorizonLine: string;
  sunCardTitle: string;
  earthCardTitle: string;
  sunlitLabel: string;
  obstructedLabel: string;
  visibleLabel: string;
  unknownLabel: string;
  marginLabel: string;
  pvPowerLabel: string;
  cumulativeEnergyLabel: string;
  noEphemerisLoaded: string;

  // Time Controls
  missionPlaybackTitle: string;
  playBtn: string;
  pauseBtn: string;
  speedLabel: string;
  stepBackBtn: string;
  stepForwardBtn: string;
  currentMissionTime: string;

  // Time Series Chart
  timeSeriesTitle: string;
  tabElevation: string;
  tabDisc: string;
  tabPower: string;
  legendSunEl: string;
  legendEarthEl: string;
  legendDirHorizon: string;
  legendZeroRef: string;
  legendDiscFrac: string;
  legendPvPower: string;

  // Visibility Timeline
  timelineTitle: string;
  timelineSub: string;
  rowSun: string;
  rowEarth: string;
  rowBoth: string;
  rowPower: string;

  // Comparison Table
  matrixTitle: string;
  matrixSub: string;
  colSite: string;
  colHorizonMode: string;
  colSunlitPct: string;
  colMeanDisc: string;
  colMaxDark: string;
  colMaxLight: string;
  colPvEnergy: string;
  colEarthVisPct: string;
  colBothVisHrs: string;
  colTradeStudy: string;
  colExport: string;
  mastStudyBtn: string;
  eventsBtn: string;
  tradeOffTitle: string;
  tradeOffIntro: string;
  siteAlphaTitle: string;
  siteAlphaDesc: string;
  siteBetaTitle: string;
  siteBetaDesc: string;
  siteGammaTitle: string;
  siteGammaDesc: string;

  // Mast Study Modal
  mastStudyModalTitle: string;
  mastStudyModalSub: string;
  mastStudyBanner: string;
  currentMastBadge: string;
  illuminationWindowLabel: string;
  meanDiscLabel: string;
  maxDarkLabel: string;
  maxLightLabel: string;
  mastTableTitle: string;
  colObsHeight: string;
  colAppClass: string;
  colIllumPct: string;
  colEnergyGen: string;
  mastStudyFooter: string;

  // How It Works Modal
  hiwModalTitle: string;
  hiwModalSub: string;
  hiwSec1Title: string;
  hiwSec1P1: string;
  hiwSec1P2: string;
  hiwSec2Title: string;
  hiwSec2P1: string;
  hiwSec2P2: string;
  hiwSec3Title: string;
  hiwSec4Title: string;
  hiwSec4Desc: string;
  hiwSec4Modes: string;
  hiwSec5Title: string;
  hiwCaveat1: string;
  hiwCaveat2: string;
  hiwCaveat3: string;
  hiwCaveat4: string;
  hiwSec6Title: string;

  // Research Modal
  researchModalTitle: string;
  researchModalSub: string;
  researchCatAll: string;
  researchCatSolar: string;
  researchCatHorizon: string;
  researchCatHeight: string;
  researchCatValidation: string;
  researchCatMulti: string;
  researchSelectTitle: string;

  // Horizon Import Modal
  importModalTitle: string;
  importModalSub: string;
  sampleProfilesTitle: string;
  sampleShackleton: string;
  sampleMalapert: string;
  sampleDeGerlache: string;
  uploadOrPasteTitle: string;
  validationValid: string;
  validationInvalid: string;
  applyProfileBtn: string;
  closeBtn: string;

  // Footer
  footerText: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  vi: {
    // App Header
    appName: 'Điều Hướng Bãi Hạ Cánh Mặt Trăng',
    appSubtitle: 'So sánh các bãi hạ cánh cực Nam Mặt Trăng qua vị trí Mặt Trời & Trái Đất so với đường chân trời',
    nasaBadge: 'NASA Space Apps',
    syncing: 'ĐANG ĐỒNG BỘ...',
    researchButton: 'Cơ sở Nghiên cứu (8 Bài báo)',
    howItWorksButton: 'Hướng dẫn Nguyên lý',
    exportJsonButton: 'Xuất JSON Sứ mệnh',
    modeRealTerrain: 'Lịch thiên văn thực + Chân trời địa hình DEM',
    modeRealGeometric: 'Lịch thiên văn thực + Chân trời hình học (0°)',
    modeDemo: 'Chế độ Dữ liệu Mô phỏng Minh họa',
    selectMode: 'Chọn Chế độ Tính toán Hoạt động',

    // Site Config Panel
    candidateSitesTitle: 'Các Bãi Hạ Cánh Ứng Viên (Tối đa 3)',
    sitesConfigured: 'Đã cấu hình',
    siteName: 'Tên Địa Điểm',
    latitudeLabel: 'Vĩ độ (Độ, Cực Nam Mặt Trăng < 0)',
    latitudeHint: 'Hợp lệ từ -90° đến -75° (Vùng cực Nam)',
    longitudeLabel: 'Kinh độ Đông dương [0° đến 360°]',
    longitudeHint: 'Quy ước Horizons: Kinh độ Đông dương [0, 360)',
    observerHeightLabel: 'Chiều cao cột quan sát trên mặt đất (m)',
    terrainElevationLabel: 'Cao độ địa hình DEM so với mặt cầu R=1737.4km (m)',
    terrainElevationHint: 'Cao độ bề mặt so với mặt cầu chuẩn 1,737,400 m',
    horizonProfileLabel: 'Hồ sơ Đường Chân Trời Địa Hình',
    noProfileAssigned: 'Chưa gắn hồ sơ địa hình (Dùng chân trời hình học 0°)',
    importCsvBtn: 'Nhập Hồ Sơ CSV',
    removeProfileBtn: 'Xóa Hồ Sơ',
    openExternalTools: 'Mở Trên Công Cụ Thám Hiểm Mặt Trăng Chính Thức',
    illustrativeNotice: 'Lưu ý: Tọa độ là các điểm khảo sát minh họa, không phải bãi hạ cánh đã được phê duyệt.',
    coordinatesConvention: 'Quy ước: Vĩ độ [-90°, +90°], Kinh độ Đông dương [0°, 360°)',

    // Mission Settings Panel
    missionSettingsTitle: 'Thiết Lập Dòng Thời Gian Sứ Mệnh',
    samplesPerSite: 'Mẫu / Điểm',
    startTimeLabel: 'Thời điểm bắt đầu sứ mệnh (UTC)',
    durationLabel: 'Thời gian khảo sát (Ngày Trái Đất)',
    maxDaysHint: 'Tối đa 14 ngày',
    samplingIntervalLabel: 'Bước lấy mẫu',
    min15: '15 Phút',
    min30: '30 Phút (Mặc định)',
    hour1: '1 Giờ',
    hour2: '2 Giờ',
    solarModelLabel: 'Mô Hình Chiếu Sáng Mặt Trời',
    finiteDiscOption: 'Mô hình Đĩa Hữu Hạn f_sun (Gläser 2014)',
    pointModelOption: 'Mô hình Điểm Hình Học Tâm Mặt Trời',
    sunlitCriterionLabel: 'Ngưỡng tiêu chuẩn có ánh sáng (f_min):',
    anyVisibleOption: 'Bất kỳ phần nào nhìn thấy (f_sun > 0%)',
    partial10Option: '10% diện tích đĩa (f_sun >= 10%)',
    halfDiscOption: 'Một nửa đĩa nhìn thấy (f_sun >= 50%)',
    fullDiscOption: 'Toàn bộ đĩa nhìn thấy (f_sun = 100%)',
    pvConfigToggle: 'Cấu hình Pin Mặt Trời & Năng lượng (Gläser 2014)',
    pvOrientationLabel: 'Hướng đặt tấm pin',
    pvTrackingVertical: 'Dựng đứng tự xoay theo phương vị (Tối ưu cực Nam)',
    pvFixedVertical: 'Dựng đứng cố định (Hướng Bắc)',
    pvHorizontalFlat: 'Nằm ngang sàn xe (Rover Deck)',
    arrayAreaLabel: 'Diện tích mảng pin (m²)',
    cellEfficiencyLabel: 'Hiệu suất tế bào quang điện (%)',
    earthClearanceLabel: 'Biên độ góc dự phòng liên lạc Trái Đất (RF Clearance)',
    earthClearanceDesc: 'Góc cao bổ sung trên chân trời địa hình để đảm bảo kết nối vô tuyến trực tiếp về Trái Đất',
    analyzeBtn: 'Phân Tích Các Bãi Hạ Cánh',
    queryingHorizons: 'Đang truy vấn lịch thiên văn JPL Horizons...',
    analysisErrorTitle: 'Lỗi Phân Tích',
    dismissBtn: 'Đóng',
    useFallbackBtn: 'Dùng Bộ Dữ Liệu Ngoại Tuyến Có Sẵn',
    horizonsFooter: 'JPL Horizons Mục tiêu 10 (Mặt Trời) & 399 (Trái Đất) | Tọa độ Trắc địa Mặt Trăng',

    // Lunar Site Map
    polarMapTitle: 'Bản Đồ Tọa Độ Vùng Cực Nam Mặt Trăng',
    polarMapSub: 'Phép chiếu cực chỉnh tâm Stereographic (-75° đến -90°S). Tỷ lệ hiển thị 1:1',
    layerRelief: 'Địa hình Đổ bóng',
    layerElevation: 'Phân tầng Độ cao LOLA',
    layerWac: 'Chiếu sáng Trung bình WAC',
    layerEarthLos: 'Tầm nhìn Trái Đất Trực tiếp',
    rulerTool: 'Thước đo Khoảng cách',
    rulerDistance: 'Khoảng cách Đo được',
    clickMapNotice: 'Nhấp lên bản đồ để di chuyển tọa độ bãi hạ cánh đang chọn',
    openQuickMap: 'LROC QuickMap',
    openMoonTrek: 'NASA Moon Trek',
    toolRelocate: 'Đổi Vị Trí',
    relocateHint: 'Nhấp bất kỳ đâu trên Mặt Trăng để đặt tọa độ',
    measureHint: 'Nhấp 2 điểm trên bản đồ để đo khoảng cách mặt cong',
    distanceLabel: 'Khoảng cách',
    layerCraters: 'Miệng Hố',
    layerPolarGrid: 'Lưới Cực',
    layerSunVector: 'Tia Mặt Trời',
    layerEarthVector: 'Tia Trái Đất',
    layerPsr: 'Bẫy Băng PSR',
    cursorLabel: 'Con trỏ',

    // Local Horizon Chart
    skyChartTitle: 'Biểu Đồ Bầu Trời & Chân Trời Địa Phương',
    skyChartSub: 'Hệ tọa độ chân trời địa phương: Phương vị [0° đến 360°], Góc cao [độ]. Mô hình đĩa Mặt Trời α = 0.266°.',
    polarZoomBtn: 'Thu phóng Cực (-4° đến +8°)',
    fullViewBtn: 'Toàn Bầu Trời (-10° đến +30°)',
    refHorizonLine: 'Chân trời Tham chiếu 0.0°',
    sunCardTitle: 'Mặt Trời',
    earthCardTitle: 'Trái Đất',
    sunlitLabel: 'Có Ánh Sáng',
    obstructedLabel: 'Bị Che Khuất',
    visibleLabel: 'Nhìn Thấy',
    unknownLabel: 'Chưa Rõ',
    marginLabel: 'Biên độ',
    pvPowerLabel: 'Công suất PV',
    cumulativeEnergyLabel: 'Điện năng',
    noEphemerisLoaded: 'Chưa nạp dữ liệu lịch thiên văn cho bãi hạ cánh đang chọn.',

    // Time Controls
    missionPlaybackTitle: 'Điều Khiển Thời Gian Sứ Mệnh',
    playBtn: 'Phát',
    pauseBtn: 'Tạm dừng',
    speedLabel: 'Tốc độ',
    stepBackBtn: 'Lùi',
    stepForwardBtn: 'Tiến',
    currentMissionTime: 'Thời Gian Sứ Mệnh UTC',

    // Time Series Chart
    timeSeriesTitle: 'Chuỗi Thời Gian Phân Tích',
    tabElevation: 'Góc cao (°)',
    tabDisc: 'Tỷ lệ đĩa f_sun (%)',
    tabPower: 'Công suất PV (Watts)',
    legendSunEl: 'Góc cao Mặt Trời',
    legendEarthEl: 'Góc cao Trái Đất',
    legendDirHorizon: 'Chân trời theo hướng',
    legendZeroRef: 'Chân trời 0°',
    legendDiscFrac: 'Tỷ lệ diện tích đĩa Mặt Trời f_sun(x) ∈ [0, 1]',
    legendPvPower: 'Công suất quang điện tức thời P_PV(t) [W]',

    // Visibility Timeline
    timelineTitle: 'Dòng Thời Gian Các Cửa Sổ Nhìn Thấy',
    timelineSub: 'Theo dõi trực quan thời gian chiếu sáng, liên lạc Trái Đất và sản xuất điện năng',
    rowSun: '1. Thấy Mặt Trời',
    rowEarth: '2. Thấy Trái Đất',
    rowBoth: '3. Thấy Cả Hai',
    rowPower: '4. Phát Điện PV',

    // Comparison Table
    matrixTitle: 'Bảng So Sánh Hiệu Năng Các Bãi Hạ Cánh Ứng Viên',
    matrixSub: 'So sánh cửa sổ chiếu sáng, tỷ lệ đĩa Mặt Trời, công suất điện và liên lạc Trái Đất',
    colSite: 'Bãi Hạ Cánh',
    colHorizonMode: 'Chế Độ Chân Trời',
    colSunlitPct: '% Sáng',
    colMeanDisc: 'Đĩa TB f̄_sun',
    colMaxDark: 'Tối Nhất (LCSP)',
    colMaxLight: 'Sáng Nhất (LCIP)',
    colPvEnergy: 'Điện Năng PV',
    colEarthVisPct: '% Thấy T.Đất',
    colBothVisHrs: 'Cả Hai (h)',
    colTradeStudy: 'Khảo Sát Cột',
    colExport: 'Xuất Dữ Liệu',
    mastStudyBtn: 'Khảo Sát Cột',
    eventsBtn: 'Sự Kiện',
    tradeOffTitle: 'Phân Tích Đánh Đổi Kiến Trúc Sứ Mệnh Đa Tiêu Chí',
    tradeOffIntro: 'Không có bãi hạ cánh nào là "hoàn hảo tuyệt đối". Mỗi vị trí đòi hỏi sự cân nhắc giữa các yêu cầu kỹ thuật:',
    siteAlphaTitle: 'Bãi Alpha (Connecting Ridge / Vành Shackleton)',
    siteAlphaDesc: 'Gờ cao Connecting Ridge nhận ánh sáng gần như liên tục (~88-92%), giảm thiểu tối đa khối lượng ắc quy. Tuy nhiên do nằm ở kinh độ 160°E, Trái Đất lặn sát hoặc xuống dưới chân trời khi Mặt Trăng đung đưa (libration), đòi hỏi vệ tinh chuyển tiếp vô tuyến.',
    siteBetaTitle: 'Bãi Beta (Khối núi Malapert Mountain)',
    siteBetaDesc: 'Nằm tại kinh độ 0°E hướng thẳng về Trái Đất, đỉnh Malapert nhìn thấy Trái Đất gần 98% thời gian, cực kỳ lý tưởng cho liên lạc trực tiếp telemetry. Tuy nhiên ở vĩ độ thấp hơn (-86°S), Mặt Trời xuống sâu hơn vào các mùa.',
    siteGammaTitle: 'Bãi Gamma (Vành miệng hố de Gerlache)',
    siteGammaDesc: 'Tiếp cận trực tiếp các vùng tối vĩnh viễn (PSR) để lấy mẫu băng nước, nhưng địa hình gồ ghề của miệng hố tạo ra các đợt bóng tối cục bộ, đòi hỏi nguồn điện dự phòng an toàn.',

    // Mast Study Modal
    mastStudyModalTitle: 'Khảo Sát Đánh Đổi Chiều Cao Cột Quan Sát (1m, 2m, 5m, 10m)',
    mastStudyModalSub: 'Độ nhạy hạ thấp chân trời địa hình & năng lượng mặt trời tại',
    mastStudyBanner: 'Theo công bố trong Barker et al. (2021) và Gläser et al. (2014), việc tăng chiều cao cột quan sát giúp hạ thấp góc cao vật cản địa hình: ΔH ≈ -arctan(Δh / d_blocker). Điều này giảm đáng kể thời gian tối liên tục dài nhất (LCSP) và tăng sản lượng điện liên tục.',
    currentMastBadge: 'Hiện Tại',
    illuminationWindowLabel: 'Cửa Sổ Chiếu Sáng',
    meanDiscLabel: 'Đĩa TB f̄_sun',
    maxDarkLabel: 'Tối Nhất (LCSP)',
    maxLightLabel: 'Sáng Nhất (LCIP)',
    mastTableTitle: 'Bảng Tổng Hợp So Sánh Các Chiều Cao Cột',
    colObsHeight: 'Chiều Cao Cột',
    colAppClass: 'Loại Ứng Dụng',
    colIllumPct: 'Chiếu Sáng (%)',
    colEnergyGen: 'Điện Năng Sinh Ra',
    mastStudyFooter: 'Phân tích độ nhạy chiều cao cột quan sát theo công bố Barker et al. (2021) Mục 5.',

    // How It Works Modal
    hiwModalTitle: 'Hướng Dẫn Nguyên Lý: Lịch Thiên Văn Cực Nam & Phân Tích Chân Trời',
    hiwModalSub: 'Nguyên lý kỹ thuật hàng không vũ trụ, hệ tọa độ trắc địa và các lưu ý khoa học',
    hiwSec1Title: '1. Hình Học Vùng Cực Mặt Trăng & Chiếu Sáng Xiên',
    hiwSec1P1: 'Khác với độ nghiêng trục quay 23.44° của Trái Đất, trục quay Mặt Trăng chỉ nghiêng 1.5424° so với mặt phẳng hoàng đạo. Vì vậy, tại vùng cực Nam Mặt Trăng (vĩ độ ≤ -85°S), Mặt Trời không bao giờ lên cao trên bầu trời mà di chuyển lướt tròn quanh đường chân trời theo chu kỳ 29.53 ngày Trái Đất trong biên độ ±1.5°.',
    hiwSec1P2: 'Do các tia nắng chiếu xiên gần như nằm ngang, ngay cả các gờ địa hình thoai thoải cũng đổ những chiếc bóng cực dài. Các gờ cao (như Connecting Ridge) hưởng ánh sáng gần như liên tục, trong khi đáy các miệng hố sâu rơi vào bóng tối vĩnh cửu tạo thành các Vùng Tối Vĩnh Viễn (PSR).',
    hiwSec2Title: '2. Hiện Tượng Đung Đưa (Libration) & Tầm Nhìn Liên Lạc Trái Đất',
    hiwSec2P1: 'Mặt Trăng bị khóa triều với Trái Đất, luôn hướng một mặt về Trái Đất. Tuy nhiên do quỹ đạo elip và độ nghiêng, Mặt Trăng trải qua hiện tượng đung đưa quang học và vật lý (libration) xấp xỉ ±6.7° theo vĩ độ và ±8.0° theo kinh độ.',
    hiwSec2P2: 'Với một nhà du hành hoặc trạm đổ bộ ở cực Nam, Trái Đất không mọc lặn hàng ngày mà vẽ nên một hình elip đung đưa 27.3 ngày, dao động vài độ lên xuống so với chân trời. Ở kinh tuyến 0°E, Trái Đất luôn ở mức +4° đến +5°. Ở phía xa hơn (như 160°E), Trái Đất định kỳ lặn xuống dưới địa hình, gây mất tín hiệu nếu không có vệ tinh chuyển tiếp.',
    hiwSec3Title: '3. Quy Ước Tọa Độ & Cấu Hình API Horizons',
    hiwSec4Title: '4. Mô Hình Chân Trời & Nội Suy Vòng Tròn 360°',
    hiwSec4Desc: 'Khả năng nhìn thấy được tính theo xấp xỉ vật thể điểm chuẩn hóa:',
    hiwSec4Modes: 'Ở Chế độ Hình học, độ cao chân trời cố định ở 0.0°. Ở Chế độ Địa hình, hồ sơ chân trời địa phương được đánh giá bằng nội suy tuyến tính vòng tròn qua ranh giới 0°/360° để đảm bảo tính liên tục của địa hình.',
    hiwSec5Title: '5. Lưu Ý Khoa Học & Giới Hạn Kỹ Thuật Thực Tế',
    hiwCaveat1: 'Thấy Mặt Trời ≠ Sản sinh Điện Năng: Sản lượng điện thực tế phụ thuộc vào góc đặt tấm pin, cosin góc tới, hệ số suy giảm nhiệt độ, bụi bám bề mặt và bức xạ tán xạ từ đất đá (albedo).',
    hiwCaveat2: 'Thấy Tâm Trái Đất ≠ Kết nối được Trạm Mặt Đất: Trái Đất tự quay 24 giờ một vòng. Nhìn thấy tâm Trái Đất không đảm bảo nhìn thấy một trạm thu DSN cụ thể (Goldstone, Madrid hay Canberra).',
    hiwCaveat3: 'Tầm nhìn Hình học ≠ Kết nối Vô tuyến Thành công: Cần tính đến hiện tượng giao thoa đa đường (multipath fading) do phản xạ bề mặt, biên độ dự phòng RF và sai số hướng anten.',
    hiwCaveat4: 'Phạm vi Bản Thử Nghiệm: Công cụ này phục vụ khảo sát sơ bộ và so sánh ứng viên cho Thử thách NASA Space Apps, không dùng làm hệ thống dẫn đường hạ cánh thực tế.',
    hiwSec6Title: 'Tài Nguyên Chính Thức Từ NASA & CSA',

    // Research Modal
    researchModalTitle: 'Tổng Quan Nghiên Cứu & Cơ Sở Khoa Học (8 Bài Báo NASA/ESA)',
    researchModalSub: 'Tài liệu tham khảo phương pháp luận từ JPL, NASA LRO, ESA và các tạp chí hành tinh bình duyệt',
    researchCatAll: 'Tất cả 10 Hình Trích Dẫn',
    researchCatSolar: 'Mô hình Đĩa Mặt Trời f_sun',
    researchCatHorizon: 'Hình Học Chân Trời & Độ Cong',
    researchCatHeight: 'Khảo Sát Chiều Cao Cột Barker',
    researchCatValidation: 'Kiểm Chứng Bóng Đổ & DEM',
    researchCatMulti: 'Đánh Giá Đa Tiêu Chí SOM',
    researchSelectTitle: 'Chọn Hình Nghiên Cứu',

    // Horizon Import Modal
    importModalTitle: 'Nhập Hồ Sơ Đường Chân Trời Địa Hình CSV',
    importModalSub: 'Gắn hồ sơ vật cản địa hình theo phương vị vào bãi hạ cánh đang chọn',
    sampleProfilesTitle: 'Nạp Nhanh Hồ Sơ Mẫu Từ DEM LOLA:',
    sampleShackleton: 'Gờ Shackleton Connecting Ridge',
    sampleMalapert: 'Khối núi Malapert Mountain',
    sampleDeGerlache: 'Vành miệng hố de Gerlache',
    uploadOrPasteTitle: 'Tải Lên Tệp CSV Hoặc Dán Dữ Liệu:',
    validationValid: 'Hồ sơ hợp lệ và sẵn sàng áp dụng',
    validationInvalid: 'Dữ liệu CSV không hợp lệ',
    applyProfileBtn: 'Áp Dụng Hồ Sơ Vào Bãi Hạ Cánh',
    closeBtn: 'Đóng',

    // Footer
    footerText: 'Lunar Landing Site Navigator — Bản thử nghiệm cho thử thách NASA Space Apps | Dữ liệu NASA JPL Horizons & Địa hình LOLA',
  },

  en: {
    // App Header
    appName: 'Lunar Landing Site Navigator',
    appSubtitle: 'South-polar candidate landing site comparison via Sun and Earth local horizon ephemerides',
    nasaBadge: 'NASA Space Apps',
    syncing: 'SYNCING...',
    researchButton: 'Research Foundations (8 Papers)',
    howItWorksButton: 'How It Works',
    exportJsonButton: 'Export Mission JSON',
    modeRealTerrain: 'Real Ephemeris + Terrain Horizon',
    modeRealGeometric: 'Real Ephemeris + Geometric Horizon (0°)',
    modeDemo: 'Demonstration / Synthetic Mode',
    selectMode: 'Select Active Calculation Mode',

    // Site Config Panel
    candidateSitesTitle: 'Candidate Sites (Max 3)',
    sitesConfigured: 'Configured',
    siteName: 'Site Name',
    latitudeLabel: 'Latitude (Degrees, South < 0)',
    latitudeHint: 'Valid between -90° and -75° (South polar zone)',
    longitudeLabel: 'East Longitude ([0° to 360°])',
    longitudeHint: 'Horizons convention: East-positive [0, 360)',
    observerHeightLabel: 'Observer Mast Height Above Ground (m)',
    terrainElevationLabel: 'Terrain Elevation Above R=1737.4km Sphere (m)',
    terrainElevationHint: 'Reference elevation above spherical radius 1,737,400 m',
    horizonProfileLabel: 'Terrain Horizon Profile',
    noProfileAssigned: 'No profile assigned (Using 0° reference horizon)',
    importCsvBtn: 'Import CSV Profile',
    removeProfileBtn: 'Remove Profile',
    openExternalTools: 'Open in Official Lunar Exploration Tools',
    illustrativeNotice: 'Note: Coordinates are illustrative study points, not approved landing sites.',
    coordinatesConvention: 'Convention: Lat [-90°, +90°], East Lon [0°, 360°)',

    // Mission Settings Panel
    missionSettingsTitle: 'Mission Timeline Settings',
    samplesPerSite: 'Samples / Site',
    startTimeLabel: 'Mission Start Timestamp (UTC)',
    durationLabel: 'Duration (Earth Days)',
    maxDaysHint: 'Max 14 days',
    samplingIntervalLabel: 'Sampling Interval',
    min15: '15 Minutes',
    min30: '30 Minutes (Default)',
    hour1: '1 Hour',
    hour2: '2 Hours',
    solarModelLabel: 'Solar Illumination Model',
    finiteDiscOption: 'Finite Disc Model (f_sun) (Gläser 2014)',
    pointModelOption: 'Point-Object Model',
    sunlitCriterionLabel: 'Sunlit Threshold Criterion (f_min):',
    anyVisibleOption: 'Any Part Visible (f_sun > 0%)',
    partial10Option: '10% Disc Area (f_sun >= 10%)',
    halfDiscOption: 'Half Disc Visible (f_sun >= 50%)',
    fullDiscOption: 'Full Disc Visible (f_sun = 100%)',
    pvConfigToggle: 'Photovoltaic Power Config (Gläser 2014)',
    pvOrientationLabel: 'Solar Array Orientation',
    pvTrackingVertical: 'Azimuth-Tracking Vertical (Polar Mast Optimal)',
    pvFixedVertical: 'Fixed Vertical (Facing North)',
    pvHorizontalFlat: 'Horizontal Flat (Rover Deck)',
    arrayAreaLabel: 'Array Area (m²)',
    cellEfficiencyLabel: 'Cell Efficiency (%)',
    earthClearanceLabel: 'Earth RF Clearance Angle Margin',
    earthClearanceDesc: 'Extra elevation margin required above terrain for direct-to-Earth radio link',
    analyzeBtn: 'Analyze Candidate Sites',
    queryingHorizons: 'Querying JPL Horizons Ephemerides...',
    analysisErrorTitle: 'Analysis Error',
    dismissBtn: 'Dismiss',
    useFallbackBtn: 'Use Bundled Offline Dataset',
    horizonsFooter: 'JPL Horizons Target 10 (Sun) & 399 (Earth) | Lunar Geodetic Coordinates',

    // Lunar Site Map
    polarMapTitle: 'Lunar South Polar Coordinate Map',
    polarMapSub: 'South-Polar Stereographic Projection (-75° to -90°S). Scaled 1:1',
    layerRelief: 'Shaded Relief',
    layerElevation: 'LOLA Elevation Tint',
    layerWac: 'WAC Solar Illumination',
    layerEarthLos: 'Earth Direct LOS',
    rulerTool: 'Distance Measurement Tool',
    rulerDistance: 'Measured Distance',
    clickMapNotice: 'Click map to relocate selected candidate site',
    openQuickMap: 'LROC QuickMap',
    openMoonTrek: 'NASA Moon Trek',
    toolRelocate: 'Relocate',
    relocateHint: 'Click anywhere on the Moon to place',
    measureHint: 'Click 2 points on the map to measure surface distance.',
    distanceLabel: 'Distance',
    layerCraters: 'Craters',
    layerPolarGrid: 'Polar Grid',
    layerSunVector: 'Sun Vector',
    layerEarthVector: 'Earth Vector',
    layerPsr: 'PSR Ice Traps',
    cursorLabel: 'Cursor',

    // Local Horizon Chart
    skyChartTitle: 'Local Horizon & Sky Chart',
    skyChartSub: 'Local topocentric coordinate system: Azimuth [0° to 360°], Elevation [deg]. Finite solar disc model α = 0.266°.',
    polarZoomBtn: 'Polar Zoom (-4° to +8°)',
    fullViewBtn: 'Full View (-10° to +30°)',
    refHorizonLine: '0.0° Reference Horizon',
    sunCardTitle: 'Sun',
    earthCardTitle: 'Earth',
    sunlitLabel: 'Sunlit',
    obstructedLabel: 'Obstructed',
    visibleLabel: 'Visible',
    unknownLabel: 'Unknown',
    marginLabel: 'Margin',
    pvPowerLabel: 'PV Power',
    cumulativeEnergyLabel: 'Energy',
    noEphemerisLoaded: 'No ephemeris data loaded for selected site.',

    // Time Controls
    missionPlaybackTitle: 'Mission Time Controls',
    playBtn: 'Play',
    pauseBtn: 'Pause',
    speedLabel: 'Speed',
    stepBackBtn: 'Step Back',
    stepForwardBtn: 'Step Forward',
    currentMissionTime: 'Mission Time UTC',

    // Time Series Chart
    timeSeriesTitle: 'Time-Series Analysis',
    tabElevation: 'Elevation Angles (°)',
    tabDisc: 'Visible Disc f_sun (%)',
    tabPower: 'PV Power (Watts)',
    legendSunEl: 'Sun Elevation',
    legendEarthEl: 'Earth Elevation',
    legendDirHorizon: 'Directional Horizon',
    legendZeroRef: '0° Reference',
    legendDiscFrac: 'Visible Solar Disc Area Fraction f_sun(x) ∈ [0, 1]',
    legendPvPower: 'Instantaneous Photovoltaic Power P_PV(t) [W]',

    // Visibility Timeline
    timelineTitle: 'Operational Visibility Windows',
    timelineSub: 'Visual timeline of direct solar illumination, Earth line-of-sight, and power generation',
    rowSun: '1. Sun Visible',
    rowEarth: '2. Earth Visible',
    rowBoth: '3. Both Visible',
    rowPower: '4. PV Power Active',

    // Comparison Table
    matrixTitle: 'Candidate Site Performance Matrix',
    matrixSub: 'Compare illumination windows, finite solar disc fraction, PV power, and direct Earth line-of-sight',
    colSite: 'Candidate Site',
    colHorizonMode: 'Horizon Mode',
    colSunlitPct: 'Sunlit %',
    colMeanDisc: 'Mean Disc f̄_sun',
    colMaxDark: 'Max Dark (LCSP)',
    colMaxLight: 'Max Light (LCIP)',
    colPvEnergy: 'PV Energy',
    colEarthVisPct: 'Earth Vis %',
    colBothVisHrs: 'Both Vis (h)',
    colTradeStudy: 'Trade Study',
    colExport: 'Export Data',
    mastStudyBtn: 'Mast Study',
    eventsBtn: 'Events',
    tradeOffTitle: 'Multi-Criteria Mission Trade-off Analysis',
    tradeOffIntro: 'No lunar landing site is universally "best". Mission architecture requires balancing competing constraints:',
    siteAlphaTitle: 'Site Alpha (Connecting Ridge / Shackleton)',
    siteAlphaDesc: 'Elevated ridge offers high cumulative illumination (~88-92%), minimizing battery mass. However, being near 160°E, Earth dips close to or below the horizon during libration, necessitating RF relay satellites or scheduled comms passes.',
    siteBetaTitle: 'Site Beta (Malapert Mountain Massif)',
    siteBetaDesc: 'Positioned on the 0°E Earth-facing meridian, the high massif provides near-continuous line of sight to Earth (~98% visibility), ideal for direct-to-Earth telemetry. However, its lower latitude (-86°S) means deeper seasonal solar drops.',
    siteGammaTitle: 'Site Gamma (de Gerlache Rim Vicinity)',
    siteGammaDesc: 'Offers direct access to permanently shadowed crater floors for volatile sampling, but rugged local crater rim topography creates intermittent terrain masking periods requiring robust power reserve margins.',

    // Mast Study Modal
    mastStudyModalTitle: 'Observer Mast Height Trade Study (1m, 2m, 5m, 10m)',
    mastStudyModalSub: 'Topographic horizon lowering & solar energy sensitivity at',
    mastStudyBanner: 'As demonstrated in Barker et al. (2021) and Gläser et al. (2014), increasing mast height lowers local horizon obstacle elevation angle: ΔH ≈ -arctan(Δh / d_blocker). This drastically reduces the longest continuous dark period (LCSP) and provides more continuous power.',
    currentMastBadge: 'Current',
    illuminationWindowLabel: 'Illumination Window',
    meanDiscLabel: 'Mean Disc f̄_sun',
    maxDarkLabel: 'Max Dark (LCSP)',
    maxLightLabel: 'Max Light (LCIP)',
    mastTableTitle: 'Comparative Metrics Summary Table',
    colObsHeight: 'Observer Height',
    colAppClass: 'Application Class',
    colIllumPct: 'Illumination (%)',
    colEnergyGen: 'Energy Generated',
    mastStudyFooter: 'Observer height sensitivity analysis referenced from Barker et al. (2021) Section 5.',

    // How It Works Modal
    hiwModalTitle: 'How It Works: Lunar Polar Ephemerides & Horizon Analysis',
    hiwModalSub: 'Aerospace engineering principles, coordinate frames, and scientific caveats',
    hiwSec1Title: '1. Lunar Polar Geometry & Grazing Solar Illumination',
    hiwSec1P1: "Unlike Earth's axial tilt of 23.44°, the Moon's rotational axis is tilted only 1.5424° relative to the ecliptic plane. Consequently, at the lunar south pole (latitudes <= 85°S), the Sun never rises high in the sky. Instead, it slowly circles the local horizon over a 29.53-day synodic lunar day, staying within approximately +-1.5° of the horizontal plane.",
    hiwSec1P2: "Because the solar rays arrive at near-horizontal grazing angles, even modest topographical elevations cast extremely long shadows. Elevated ridges experience extended periods of near-continuous illumination, while depressed crater floors remain in perpetual darkness as Permanently Shadowed Regions (PSRs).",
    hiwSec2Title: '2. Earth Libration & Communications Line of Sight',
    hiwSec2P1: 'The Moon is tidally locked to Earth, so the same lunar hemisphere predominantly faces Earth. However, due to orbital eccentricity and tilt, the Moon undergoes optical and physical libration of approximately +-6.7° in latitude and +-8.0° in longitude.',
    hiwSec2P2: 'As seen near the south pole, Earth does not rise and set daily. Instead, it traces out a slow 27.3-day libration oval in the sky, oscillating a few degrees above and below the horizon. On the Earth-facing meridian (0°E), Earth remains around +4° to +5° elevation. Further toward the farside (e.g. 160°E), Earth periodically dips below local topography, creating direct communications blackouts.',
    hiwSec3Title: '3. Coordinate Conventions & Horizons Specification',
    hiwSec4Title: '4. Horizon Modeling & Circular Interpolation',
    hiwSec4Desc: 'Visibility is calculated using the documented point-object approximation:',
    hiwSec4Modes: 'In Geometric Mode, the horizon elevation is fixed at 0.0°. In Terrain Mode, the local horizon profile is evaluated using circular linear interpolation across the 0°/360° seam to ensure continuous topography wrapping.',
    hiwSec5Title: '5. Scientific Caveats & Practical Engineering Limitations',
    hiwCaveat1: 'Sun Visibility != Electrical Power Generation: Actual power output depends on solar array orientation, cosine of incidence angle, temperature coefficients, dust accumulation, and terrain-reflected radiation (albedo).',
    hiwCaveat2: 'Earth-Center Visibility != Ground Station Line-of-Sight: Earth rotates once every 24 hours. Visibility of the Earth center does not guarantee line-of-sight to a specific Deep Space Network (DSN) antenna complex (Goldstone, Madrid, or Canberra).',
    hiwCaveat3: 'Geometric Line-of-Sight != RF Radio Link: Direct line-of-sight is necessary but not sufficient. Multipath fading caused by regolith reflections, RF link margins, and antenna pointing error must be accounted for.',
    hiwCaveat4: 'Exploratory Prototype Scope: This prototype is built for preliminary exploration and candidate site comparison for the NASA Space Apps Challenge, not for operational flight descent trajectory guidance or human landing system certification.',
    hiwSec6Title: 'Official NASA & CSA Resources',

    // Research Modal
    researchModalTitle: 'Literature Review & Research Foundations (8 NASA/ESA Papers)',
    researchModalSub: 'Methodological references from JPL, NASA LRO, ESA, and peer-reviewed planetary journals',
    researchCatAll: 'All 10 Literature Figures',
    researchCatSolar: 'Finite Solar Disc & Illumination',
    researchCatHorizon: 'Horizon & Curvature Geometry',
    researchCatHeight: 'Observer Mast Height Study',
    researchCatValidation: 'Shadow Mismatch Validation',
    researchCatMulti: 'Multi-Criteria Landing Selection',
    researchSelectTitle: 'Select Literature Figure',

    // Horizon Import Modal
    importModalTitle: 'Import Terrain Horizon CSV Profile',
    importModalSub: 'Associate an azimuthal topographic obstruction profile with the active site',
    sampleProfilesTitle: 'Load Verified Sample Topography Profiles:',
    sampleShackleton: 'Shackleton Connecting Ridge Topography',
    sampleMalapert: 'Malapert Mountain Topography',
    sampleDeGerlache: 'de Gerlache Rim Topography',
    uploadOrPasteTitle: 'Upload CSV File or Paste Raw Text:',
    validationValid: 'Horizon profile valid and ready to apply',
    validationInvalid: 'Invalid horizon CSV data',
    applyProfileBtn: 'Apply Profile to Candidate Site',
    closeBtn: 'Close',

    // Footer
    footerText: 'Lunar Landing Site Navigator — Prototype for the NASA Space Apps Challenge | NASA JPL Horizons & LOLA Topography',
  },
};
