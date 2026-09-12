import { BridgeLevel } from '../physics/bridgeTypes';

export const BRIDGE_LEVELS: BridgeLevel[] = [
  {
    id: 1,
    title: 'Màn 1: Khe Núi Hẹp',
    subtitle: 'Làm quen kết cấu dàn tam giác cơ bản',
    description:
      'Nối liền hai bờ vách đá hẹp bằng mặt đường và gia cố khung dầm gỗ chịu tải. Chiếc xe du lịch nhỏ cần qua bờ an toàn.',
    budget: 4800,
    leftAnchor: [180, 260],
    rightAnchor: [420, 260],
    waterY: 420,
    targetStars: {
      threeStar: 3200,
      twoStar: 4200,
    },
    vehicleWeight: '1.5 Tấn (Xe du lịch)',
  },
  {
    id: 2,
    title: 'Màn 2: Sông Rộng & Trụ Đá Giữa',
    subtitle: 'Tận dụng mố trụ trung tâm để chia nhịp chịu lực',
    description:
      'Khoảng cách bờ sông rộng hơn gấp đôi. May mắn là giữa lòng sông có một mố đá tự nhiên làm điểm tựa chịu nén.',
    budget: 9500,
    leftAnchor: [140, 260],
    rightAnchor: [540, 260],
    middleAnchors: [[340, 360]],
    waterY: 430,
    targetStars: {
      threeStar: 6800,
      twoStar: 8600,
    },
    vehicleWeight: '3.0 Tấn (Xe bán tải)',
  },
  {
    id: 3,
    title: 'Màn 3: Vực Thẳm Cầu Treo Dây Cáp',
    subtitle: 'Sử dụng cáp thép chịu kéo neo vào vách đá cao',
    description:
      'Vực sâu không có trụ đỡ dưới đáy. Hãy tận dụng 2 mỏm đá cao để giăng dây cáp treo (Cable) siêu nhẹ và siêu bền kéo!',
    budget: 16000,
    leftAnchor: [130, 250],
    rightAnchor: [550, 250],
    middleAnchors: [
      [130, 130], // Neo vách đá cao bên trái
      [550, 130], // Neo vách đá cao bên phải
    ],
    waterY: 440,
    targetStars: {
      threeStar: 11000,
      twoStar: 14000,
    },
    vehicleWeight: '4.5 Tấn (Xe cứu hỏa)',
  },
  {
    id: 4,
    title: 'Màn 4: Thử Thách Xe Tải Siêu Trọng',
    subtitle: 'Thiết kế giàn thép chịu nén & cáp văng cường độ cao',
    description:
      'Đoàn xe tải container hạng nặng chuẩn bị vận chuyển thiết bị qua thung lũng. Mọi thanh giàn phải được tính toán phân tán lực nén và lực kéo tối ưu.',
    budget: 25000,
    leftAnchor: [110, 260],
    rightAnchor: [590, 260],
    middleAnchors: [
      [110, 110],
      [590, 110],
    ],
    waterY: 440,
    targetStars: {
      threeStar: 17500,
      twoStar: 22000,
    },
    vehicleWeight: '8.5 Tấn (Xe container)',
  },
];
