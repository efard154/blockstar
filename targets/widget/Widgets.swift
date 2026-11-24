import SwiftUI
import WidgetKit

// MARK: - Bundle

@main
struct BlockstarWidgets: WidgetBundle {
  var body: some Widget {
    NextWidget()
    TodayWidget()
    ProgressWidget()
  }
}

// MARK: - Widgets (kinds must match WIDGET_KINDS in src/widgets/native.ts)

struct NextWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NextWidget", provider: Provider()) { entry in
      NextWidgetView(entry: entry)
    }
    .configurationDisplayName("Next up")
    .description("Your next event with a live countdown.")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline])
  }
}

struct TodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TodayWidget", provider: Provider()) { entry in
      TodayWidgetView(entry: entry)
    }
    .configurationDisplayName("Today")
    .description("The rest of today's agenda.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

struct ProgressWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "ProgressWidget", provider: Provider()) { entry in
      ProgressWidgetView(entry: entry)
    }
    .configurationDisplayName("Progress")
    .description("How much of today is done.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: - Shared bits

private struct Caption: View {
  let text: String
  let color: Color
  var body: some View {
    Text(text.uppercased())
      .font(.system(size: 11, weight: .bold))
      .foregroundStyle(color)
  }
}

private extension View {
  func widgetSurface(_ s: Snapshot) -> some View {
    containerBackground(for: .widget) { Color(hex: s.theme.surface) }
  }
}

// MARK: - Next up

struct NextWidgetView: View {
  let entry: SnapshotEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    let s = entry.snapshot
    let next = s.next(at: entry.date)

    switch family {
    case .accessoryInline:
      if let next {
        Text("\(next.item.time) \(next.item.title)")
      } else {
        Text(s.strings.nothingNext)
      }

    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        if let next {
          Text(next.item.title).font(.headline).lineLimit(1)
          Text(next.item.time).font(.system(.title3, design: .rounded).weight(.bold))
          countdown(next, s)
        } else {
          Text(s.strings.nothingNext).font(.headline)
        }
      }
      .containerBackground(for: .widget) { Color.clear }

    default:
      VStack(alignment: .leading, spacing: 6) {
        Caption(text: s.strings.next, color: Color(hex: s.theme.textMuted))
        if let next {
          Text(next.item.title)
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color(hex: s.theme.text))
            .lineLimit(2)
          Spacer(minLength: 0)
          Text(next.item.time)
            .font(.system(size: 30, weight: .heavy, design: .rounded))
            .foregroundStyle(Color(hex: s.theme.accent))
          countdown(next, s)
        } else {
          Spacer()
          Text(s.strings.nothingNext)
            .font(.subheadline)
            .foregroundStyle(Color(hex: s.theme.textMuted))
          Spacer()
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .widgetSurface(s)
    }
  }

  /// "in 25 min" that ticks down by itself, or "Happening now".
  @ViewBuilder
  private func countdown(_ next: (item: Snapshot.Item, ongoing: Bool), _ s: Snapshot) -> some View {
    Group {
      if next.ongoing {
        Text(s.strings.now)
      } else {
        Text("\(s.strings.inPrefix) ") + Text(next.item.startDate, style: .relative)
      }
    }
    .font(.system(size: 12))
    .foregroundStyle(Color(hex: s.theme.textMuted))
    .lineLimit(1)
  }
}

// MARK: - Today

struct TodayWidgetView: View {
  let entry: SnapshotEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    let s = entry.snapshot
    let all = s.today(at: entry.date)
    let remaining = s.remainingToday(at: entry.date)
    let limit = family == .systemLarge ? 9 : 4
    let shown = Array(remaining.prefix(limit))

    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(s.strings.today)
          .font(.system(size: 15, weight: .heavy))
          .foregroundStyle(Color(hex: s.theme.text))
        Spacer()
        Text(s.dayLabel(at: entry.date))
          .font(.system(size: 13))
          .foregroundStyle(Color(hex: s.theme.textMuted))
      }

      if shown.isEmpty {
        Spacer()
        Text(all.isEmpty ? s.strings.noEvents : s.strings.allDone)
          .font(.subheadline)
          .foregroundStyle(Color(hex: s.theme.textMuted))
        Spacer()
      } else {
        VStack(alignment: .leading, spacing: 5) {
          ForEach(shown, id: \.self) { item in
            HStack(spacing: 8) {
              RoundedRectangle(cornerRadius: 2)
                .fill(Color(hex: s.theme.primary))
                .frame(width: 4, height: 16)
              Text(item.time)
                .font(.system(size: 13, weight: .bold).monospacedDigit())
                .foregroundStyle(Color(hex: s.theme.accent))
                .frame(width: 44, alignment: .leading)
              Text(item.title)
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: s.theme.text))
                .lineLimit(1)
            }
          }
          if remaining.count > shown.count {
            Text("+\(remaining.count - shown.count) \(s.strings.more)")
              .font(.system(size: 12))
              .foregroundStyle(Color(hex: s.theme.textMuted))
          }
        }
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetSurface(s)
  }
}

// MARK: - Progress

struct ProgressWidgetView: View {
  let entry: SnapshotEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    let s = entry.snapshot
    let p = s.progress(at: entry.date)
    let fraction = p.total == 0 ? 0 : Double(p.done) / Double(p.total)

    switch family {
    case .accessoryCircular:
      Gauge(value: fraction) {
        Text(s.strings.progress)
      } currentValueLabel: {
        Text("\(p.done)/\(p.total)")
      }
      .gaugeStyle(.accessoryCircularCapacity)
      .containerBackground(for: .widget) { Color.clear }

    default:
      VStack(alignment: .leading, spacing: 4) {
        Caption(text: s.strings.progress, color: Color(hex: s.theme.textMuted))
        Spacer(minLength: 0)
        if p.total == 0 {
          Text(s.strings.noEvents)
            .font(.subheadline)
            .foregroundStyle(Color(hex: s.theme.textMuted))
          Spacer(minLength: 0)
        } else {
          Text("\(p.done)/\(p.total)")
            .font(.system(size: 36, weight: .heavy, design: .rounded))
            .foregroundStyle(Color(hex: s.theme.text))
          Text(s.strings.done)
            .font(.system(size: 12))
            .foregroundStyle(Color(hex: s.theme.textMuted))
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(Color.gray.opacity(0.25))
              Capsule()
                .fill(Color(hex: s.theme.primary))
                .frame(width: max(8, geo.size.width * fraction))
                .opacity(p.done == 0 ? 0 : 1)
            }
          }
          .frame(height: 8)
          .padding(.top, 6)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .widgetSurface(s)
    }
  }
}
